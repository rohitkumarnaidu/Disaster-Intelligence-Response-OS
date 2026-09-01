import { Router } from "express";
import { db, evidence } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

const router = Router();
router.use(requireAuth);

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

function checkMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  if (mimetype === 'image/jpeg') {
    return hex.startsWith('FFD8FF');
  } else if (mimetype === 'image/png') {
    return hex === '89504E47';
  } else if (mimetype === 'image/webp') {
    const riff = hex;
    const webp = buffer.toString('hex', 8, 12).toUpperCase();
    return riff === '52494646' && webp === '57454250';
  } else if (mimetype === 'video/mp4') {
    const ftyp = buffer.toString('hex', 4, 8).toUpperCase();
    return ftyp === '66747970';
  }
  return false;
}

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { caseId, type, source, metadata } = req.body;
    const file = req.file;
    if (!caseId || !type || !file) {
      return res.status(400).json({ error: { message: "caseId, type, and file required" } });
    }

    if (!checkMagicBytes(file.buffer, file.mimetype)) {
      return res.status(400).json({ error: { message: "Invalid file signature" } });
    }

    const id = `ev-${Date.now()}`;
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const safeFilename = `${id}-${hash.substring(0, 8)}${path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '')}`;
    
    // Abstract StorageService: right now local, could be S3
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const uploadPath = path.resolve(uploadsDir, safeFilename);
    
    if (!uploadPath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: { message: "Invalid upload path" } });
    }

    fs.writeFileSync(uploadPath, file.buffer);
    
    const uri = `/uploads/${safeFilename}`;

    const newEvidence = {
      id,
      caseId,
      type,
      uri,
      source: source || "Field Upload",
      mimeType: file.mimetype,
      size: file.size,
      checksum: hash,
      metadata: metadata ? JSON.parse(metadata) : {},
      createdBy: req.session.userId,
      timestamp: new Date()
    };

    const { cases, auditEvents } = await import("@workspace/db");
    const { eq } = await import("drizzle-orm");
    const { enqueueOutboxEvent, dispatchCommittedEvent } = await import("../realtime/outbox");

    const [c] = await db.select().from(cases).where(eq(cases.id, caseId));
    let evidenceEvent: any = null;
    let auditEventObj: any = null;

    await db.transaction(async (tx: any) => {
      await tx.insert(evidence).values(newEvidence);
      
      const auditId = `ae-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await tx.insert(auditEvents).values({
        id: auditId,
        actorId: req.session.userId,
        entityType: "CASE",
        entityId: caseId,
        action: "EVIDENCE_UPLOADED",
        metadata: { evidenceId: id, type, uri, size: file.size },
        timestamp: new Date(),
      });

      evidenceEvent = await enqueueOutboxEvent(tx, {
        eventType: "EVIDENCE_UPLOADED",
        entityType: "EVIDENCE",
        entityId: id,
        incidentId: c?.incidentId || null,
        version: 1,
        actorId: req.session.userId,
        payload: {
          ...newEvidence,
          incidentId: c?.incidentId || null,
          timestamp: newEvidence.timestamp.toISOString(),
        },
      });

      auditEventObj = await enqueueOutboxEvent(tx, {
        eventType: "AUDIT_EVENT_CREATED",
        entityType: "AUDIT",
        entityId: caseId,
        incidentId: c?.incidentId || null,
        version: 1,
        actorId: req.session.userId,
        payload: {
          id: auditId,
          action: "EVIDENCE_UPLOADED",
          entityType: "CASE",
          entityId: caseId,
          actorId: req.session.userId,
          metadata: { evidenceId: id, type },
          timestamp: new Date().toISOString(),
        },
      });
    });

    if (evidenceEvent) dispatchCommittedEvent(evidenceEvent).catch(() => {});
    if (auditEventObj) dispatchCommittedEvent(auditEventObj).catch(() => {});

    res.json({ success: true, evidence: newEvidence });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;

