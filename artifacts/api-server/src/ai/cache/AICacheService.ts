import { db, aiCache } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../../lib/logger";

export class AICacheService {
  private static instance: AICacheService;

  public static getInstance(): AICacheService {
    if (!AICacheService.instance) {
      AICacheService.instance = new AICacheService();
    }
    return AICacheService.instance;
  }

  public generateCacheKey(inputHash: string, model: string, promptVersion: string, schemaVersion: string): string {
    return crypto
      .createHash("sha256")
      .update(`${inputHash}:${model}:${promptVersion}:${schemaVersion}`)
      .digest("hex");
  }

  public async getCached(
    inputHash: string,
    model: string,
    promptVersion: string,
    schemaVersion: string
  ): Promise<any | null> {
    try {
      const cacheKey = this.generateCacheKey(inputHash, model, promptVersion, schemaVersion);
      const [entry] = await db
        .select()
        .from(aiCache)
        .where(eq(aiCache.id, cacheKey));

      if (!entry) return null;

      // Check TTL if configured
      if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
        await db.delete(aiCache).where(eq(aiCache.id, cacheKey));
        return null;
      }

      // Increment hit counter asynchronously
      db.update(aiCache)
        .set({ hitCount: entry.hitCount + 1 })
        .where(eq(aiCache.id, cacheKey))
        .catch(() => {});

      logger.info({ cacheKey, model, promptVersion }, "AI Cache Hit");
      return entry.responsePayload;
    } catch (err: any) {
      logger.warn({ err }, "AI Cache read error - proceeding with live inference");
      return null;
    }
  }

  public async setCached(options: {
    inputHash: string;
    provider: string;
    model: string;
    promptVersion: string;
    schemaVersion: string;
    responsePayload: any;
    tokenUsage?: any;
    latencyMs?: number;
    ttlMinutes?: number;
  }): Promise<void> {
    try {
      const {
        inputHash,
        provider,
        model,
        promptVersion,
        schemaVersion,
        responsePayload,
        tokenUsage,
        latencyMs,
        ttlMinutes = 1440, // 24 hours default
      } = options;

      const cacheKey = this.generateCacheKey(inputHash, model, promptVersion, schemaVersion);
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await db
        .insert(aiCache)
        .values({
          id: cacheKey,
          inputHash,
          provider,
          model,
          promptVersion,
          schemaVersion,
          responsePayload,
          tokenUsage: tokenUsage || {},
          latencyMs: latencyMs || 0,
          hitCount: 1,
          expiresAt,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: aiCache.id,
          set: {
            responsePayload,
            hitCount: 1,
            expiresAt,
          },
        });
    } catch (err: any) {
      logger.warn({ err }, "Failed to write to AI Cache");
    }
  }
}

export const aiCacheService = AICacheService.getInstance();
