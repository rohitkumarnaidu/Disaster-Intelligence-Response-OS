import { pgTable, text, serial, timestamp, jsonb, boolean, integer, doublePrecision, varchar, real } from "drizzle-orm/pg-core";
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
  externalEventId: text("external_event_id"),
  sourceApi: text("source_api"),
});

export const imageryAssets = pgTable("imagery_assets", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id),
  filename: text("filename"),
  source: text("source").notNull(),
  acquisitionTime: timestamp("acquisition_time").notNull(),
  captureType: text("capture_type"),
  geometry: jsonb("geometry"), // Footprint polygon GeoJSON
  bbox: jsonb("bbox"), // [minLon, minLat, maxLon, maxLat]
  qualityStatus: text("quality_status").default("READY"),
  storagePath: text("storage_path"),
  metadata: jsonb("metadata").default({}),
  processingStatus: text("processing_status").default("UNPROCESSED"),
  // Real data provenance & catalog attributes
  externalProductId: text("external_product_id"),
  provider: text("provider"),
  collection: text("collection"),
  title: text("title"),
  sourceUrl: text("source_url"),
  catalogUrl: text("catalog_url"),
  localUri: text("local_uri"),
  mimeType: text("mime_type"),
  size: integer("size"),
  checksum: text("checksum"),
  processingLevel: text("processing_level"),
  cloudCover: real("cloud_cover"),
  downloadStatus: text("download_status").default("PENDING"),
  dataMode: text("data_mode").default("REAL"), // 'REAL' vs 'DEMO'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const criticalAssets = pgTable("critical_assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  location: jsonb("location").notNull(),
  criticalityScore: integer("criticality_score").notNull(),
  populationExposureTier: text("population_exposure_tier").notNull(),
  osmId: text("osm_id"),
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
  externalSource: text("external_source"),
  externalId: text("external_id"),
  processingJobId: text("processing_job_id"),
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
  dataMode: text("data_mode").default("REAL"),
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

// ============================================================
// External Data Sources & Processing Registry
// ============================================================

export const dataSources = pgTable("data_sources", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // SATELLITE_CATALOG, SATELLITE_PROCESSOR, VECTOR_OSM, WEATHER, FIRE_HOTSPOTS, CAP_ALERTS
  baseUrl: text("base_url").notNull(),
  status: text("status").notNull().default("CONFIGURED"),
  authType: text("auth_type").notNull().default("OAUTH2"),
  freshnessClass: text("freshness_class").default("NEAR_REAL_TIME"),
  coverage: text("coverage").default("GLOBAL"),
  latencyMs: integer("latency_ms"),
  lastSuccessfulRequest: timestamp("last_successful_request"),
  lastFailure: timestamp("last_failure"),
  lastErrorMessage: text("last_error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fireDetections = pgTable("fire_detections", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id),
  externalId: text("external_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  brightness: real("brightness"),
  confidence: text("confidence"),
  frp: real("frp"),
  satellite: text("satellite"),
  instrument: text("instrument"),
  acqTime: timestamp("acq_time"),
  geometry: jsonb("geometry").notNull(),
  source: text("source").default("NASA_FIRMS"),
  retrievedAt: timestamp("retrieved_at").defaultNow().notNull(),
  rawPayload: jsonb("raw_payload"),
});

export const imageryPairs = pgTable("imagery_pairs", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id).notNull(),
  beforeImageryId: text("before_imagery_id").references(() => imageryAssets.id).notNull(),
  afterImageryId: text("after_imagery_id").references(() => imageryAssets.id).notNull(),
  overlapPercentage: real("overlap_percentage").default(100),
  temporalDeltaHours: real("temporal_delta_hours"),
  status: text("status").notNull().default("VALIDATED"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id),
  imageryAssetId: text("imagery_asset_id").references(() => imageryAssets.id),
  pairId: text("pair_id").references(() => imageryPairs.id),
  provider: text("provider").notNull(),
  jobType: text("job_type").notNull(), // DISCOVERY, DOWNLOAD, PREPROCESS, CHANGE_DETECTION, THUMBNAIL
  status: text("status").notNull().default("QUEUED"), // QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  attempts: integer("attempts").default(0),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  parameters: jsonb("parameters").default({}),
  resultMetadata: jsonb("result_metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const osmCriticalAssets = pgTable("osm_critical_assets", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id),
  osmId: text("osm_id").notNull(),
  osmType: text("osm_type").notNull(), // node, way, relation
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // Hospital, School, Emergency, Bridge, Utility, Shelter
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  geometry: jsonb("geometry").notNull(),
  tags: jsonb("tags").default({}),
  criticalityScore: integer("criticality_score").default(50),
  populationExposureTier: text("population_exposure_tier").default("Medium"),
  source: text("source").default("OpenStreetMap"),
  retrievedAt: timestamp("retrieved_at").defaultNow().notNull(),
});

export const externalFeeds = pgTable("external_feeds", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  feedType: text("feed_type").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  lastEventId: text("last_event_id"),
  status: text("status").default("active"),
  config: jsonb("config"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weatherAlerts = pgTable("weather_alerts", {
  id: text("id").primaryKey(),
  externalId: text("external_id").unique(),
  incidentId: text("incident_id").references(() => incidents.id),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  headline: text("headline"),
  description: text("description"),
  instruction: text("instruction"),
  area: jsonb("area"),
  effectiveAt: timestamp("effective_at"),
  expiresAt: timestamp("expires_at"),
  source: text("source"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const disasterEvents = pgTable("disaster_events", {
  id: text("id").primaryKey(),
  externalId: text("external_id").unique(),
  source: text("source").notNull(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  severity: text("severity"),
  magnitude: real("magnitude"),
  location: jsonb("location"),
  boundingBox: jsonb("bounding_box"),
  country: text("country"),
  populationExposed: integer("population_exposed"),
  sourceUrl: text("source_url"),
  incidentId: text("incident_id").references(() => incidents.id),
  rawPayload: jsonb("raw_payload"),
  eventTime: timestamp("event_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// AI & MLOps Infrastructure
// ============================================================

export const modelVersions = pgTable("model_versions", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(), // GEMINI, MOCK_VISION, PYTORCH, OPENAI
  model: text("model").notNull(), // gemini-2.5-flash, sentinel1-sar-v3
  version: text("version").notNull(), // v1.0.0
  task: text("task").notNull(), // DAMAGE_ASSESSMENT, EVIDENCE_SUMMARY, REPORT_GENERATION, ASSISTANT
  status: text("status").notNull().default("ACTIVE"), // ACTIVE, TESTING, DEPRECATED, DISABLED
  parameters: jsonb("parameters").default({}),
  evaluationMetrics: jsonb("evaluation_metrics").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiDecisionLogs = pgTable("ai_decision_logs", {
  id: text("id").primaryKey(),
  caseId: text("case_id").references(() => cases.id),
  jobId: text("job_id"),
  incidentId: text("incident_id").references(() => incidents.id),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  modelVersion: text("model_version").notNull(),
  promptVersion: text("prompt_version").notNull(),
  inputHash: text("input_hash").notNull(),
  outputHash: text("output_hash"),
  result: jsonb("result").notNull(),
  damageClass: text("damage_class"),
  confidence: doublePrecision("confidence"),
  latencyMs: integer("latency_ms"),
  tokenUsage: jsonb("token_usage"),
  reviewerDecision: text("reviewer_decision").default("PENDING"), // PENDING, CONFIRMED, REJECTED, UNCERTAIN
  reviewerNotes: text("reviewer_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiCache = pgTable("ai_cache", {
  id: text("id").primaryKey(), // composite hash key
  inputHash: text("input_hash").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  schemaVersion: text("schema_version").notNull(),
  responsePayload: jsonb("response_payload").notNull(),
  tokenUsage: jsonb("token_usage"),
  latencyMs: integer("latency_ms"),
  hitCount: integer("hit_count").default(1).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiEvaluationDataset = pgTable("ai_evaluation_dataset", {
  id: text("id").primaryKey(),
  incidentId: text("incident_id").references(() => incidents.id),
  caseId: text("case_id").references(() => cases.id),
  source: text("source").notNull(), // FIELD_OBSERVATION, EXPERT_VERIFIED, BENCHMARK_SUITE
  split: text("split").notNull().default("TEST"), // TRAIN, VALIDATION, TEST
  inputData: jsonb("input_data").notNull(),
  groundTruth: jsonb("ground_truth").notNull(),
  modelPrediction: jsonb("model_prediction"),
  confidence: doublePrecision("confidence"),
  humanLabel: text("human_label"),
  outcome: text("outcome"),
  annotationMethod: text("annotation_method"),
  version: text("version").default("v1.0.0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// Real-Time Transactional Outbox
// ============================================================

export const outboxEvents = pgTable("outbox_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  incidentId: text("incident_id"),
  organizationId: text("organization_id"),
  version: integer("version").default(1).notNull(),
  payload: jsonb("payload").notNull(),
  actorId: text("actor_id"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  attempts: integer("attempts").default(0).notNull(),
  lastError: text("last_error"),
  correlationId: text("correlation_id"),
});


