import { pgTable, text, serial, timestamp, jsonb, boolean, integer, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // using uuid/nanoid
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  organizationId: text("organization_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
});

export const incidents = pgTable("incidents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  disasterType: text("disaster_type").notNull(),
  status: text("status").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  aoi: jsonb("aoi"), // GeoJSON
  source: text("source"),
  description: text("description"),
  severity: text("severity"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const imageryAssets = pgTable("imagery_assets", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id).notNull(),
  filename: text("filename").notNull(),
  source: text("source").notNull(),
  acquisitionTime: timestamp("acquisition_time").notNull(),
  captureType: text("capture_type"),
  geometry: jsonb("geometry"),
  qualityStatus: text("quality_status"),
  storagePath: text("storage_path").notNull(),
  metadata: jsonb("metadata"),
  processingStatus: text("processing_status").notNull(),
});

export const criticalAssets = pgTable("critical_assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  location: jsonb("location").notNull(),
  criticalityScore: integer("criticality_score").notNull(),
  populationExposureTier: text("population_exposure_tier").notNull(),
});

export const detections = pgTable("detections", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id).notNull(),
  imageryId: text("imagery_id").references(() => imageryAssets.id),
  geometry: jsonb("geometry").notNull(),
  class: text("class").notNull(),
  severity: text("severity").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  modelName: text("model_name").notNull(),
  modelVersion: text("model_version").notNull(),
  inferenceTimestamp: timestamp("inference_timestamp").notNull(),
});

export const cases = pgTable("cases", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id).notNull(),
  detectionId: text("detection_id").references(() => detections.id),
  assetId: text("asset_id").references(() => criticalAssets.id),
  status: text("status").notNull(),
  priorityScore: doublePrecision("priority_score"),
  priorityBreakdown: jsonb("priority_breakdown"),
  reviewState: text("review_state").notNull(),
  owner: text("owner").references(() => users.id),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const evidence = pgTable("evidence", {
  id: text("id").primaryKey(),
  caseId: text("case_id").references(() => cases.id).notNull(),
  type: text("type").notNull(),
  uri: text("uri").notNull(),
  source: text("source").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  checksum: text("checksum"),
  metadata: jsonb("metadata"),
  createdBy: text("created_by").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  caseId: text("case_id").references(() => cases.id).notNull(),
  reviewer: text("reviewer").references(() => users.id).notNull(),
  decision: text("decision").notNull(),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  caseId: text("case_id").references(() => cases.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: integer("priority").notNull(),
  assignedTeam: text("assigned_team"),
  assignedUser: text("assigned_user").references(() => users.id),
  status: text("status").notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dueAt: timestamp("due_at"),
  escalationAt: timestamp("escalation_at"),
  completedAt: timestamp("completed_at"),
});

export const fieldObservations = pgTable("field_observations", {
  id: text("id").primaryKey(),
  caseId: text("case_id").references(() => cases.id).notNull(),
  taskId: text("task_id").references(() => tasks.id),
  location: jsonb("location"),
  media: jsonb("media"),
  notes: text("notes"),
  verificationStatus: text("verification_status").notNull(),
  syncStatus: text("sync_status").notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outcomes = pgTable("outcomes", {
  id: text("id").primaryKey(),
  caseId: text("case_id").references(() => cases.id).notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  evidence: jsonb("evidence"),
  completedBy: text("completed_by").references(() => users.id).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const caseStatusHistory = pgTable("case_status_history", {
  id: text("id").primaryKey(),
  caseId: text("case_id").references(() => cases.id).notNull(),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  user: text("user").references(() => users.id).notNull(),
  reason: text("reason"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// session store table for connect-pg-simple
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});