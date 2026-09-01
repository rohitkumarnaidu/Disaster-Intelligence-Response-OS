export const INIT_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,
  organization_id text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
  id text PRIMARY KEY,
  name text NOT NULL,
  disaster_type text NOT NULL,
  status text NOT NULL,
  start_time timestamp,
  end_time timestamp,
  aoi jsonb,
  source text,
  description text,
  severity text,
  created_by text REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  external_event_id text,
  source_api text
);

CREATE TABLE IF NOT EXISTS imagery_assets (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id),
  filename text,
  source text NOT NULL,
  acquisition_time timestamp NOT NULL,
  capture_type text,
  geometry jsonb,
  bbox jsonb,
  quality_status text DEFAULT 'READY',
  storage_path text,
  metadata jsonb DEFAULT '{}',
  processing_status text DEFAULT 'UNPROCESSED',
  external_product_id text,
  provider text,
  collection text,
  title text,
  source_url text,
  catalog_url text,
  local_uri text,
  mime_type text,
  size integer,
  checksum text,
  processing_level text,
  cloud_cover real,
  download_status text DEFAULT 'PENDING',
  data_mode text DEFAULT 'REAL',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS critical_assets (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  location jsonb NOT NULL,
  criticality_score integer NOT NULL,
  population_exposure_tier text NOT NULL,
  osm_id text
);

CREATE TABLE IF NOT EXISTS detections (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id) NOT NULL,
  imagery_id text REFERENCES imagery_assets(id),
  geometry jsonb NOT NULL,
  class text NOT NULL,
  severity text NOT NULL,
  confidence double precision NOT NULL,
  model_name text NOT NULL,
  model_version text NOT NULL,
  inference_timestamp timestamp NOT NULL,
  external_source text,
  external_id text,
  processing_job_id text
);

CREATE TABLE IF NOT EXISTS cases (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id) NOT NULL,
  detection_id text REFERENCES detections(id),
  asset_id text REFERENCES critical_assets(id),
  status text NOT NULL,
  priority_score double precision,
  priority_breakdown jsonb,
  review_state text NOT NULL,
  owner text REFERENCES users(id),
  version integer DEFAULT 1 NOT NULL,
  data_mode text DEFAULT 'REAL',
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) NOT NULL,
  type text NOT NULL,
  uri text NOT NULL,
  source text NOT NULL,
  mime_type text,
  size integer,
  checksum text,
  metadata jsonb,
  created_by text REFERENCES users(id),
  timestamp timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) NOT NULL,
  reviewer text REFERENCES users(id) NOT NULL,
  decision text NOT NULL,
  reason text,
  notes text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) NOT NULL,
  title text NOT NULL,
  description text,
  priority integer NOT NULL,
  assigned_team text,
  assigned_user text REFERENCES users(id),
  status text NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  due_at timestamp,
  escalation_at timestamp,
  completed_at timestamp
);

CREATE TABLE IF NOT EXISTS field_observations (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) NOT NULL,
  task_id text REFERENCES tasks(id),
  location jsonb,
  media jsonb,
  notes text,
  verification_status text NOT NULL,
  sync_status text NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS outcomes (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) NOT NULL,
  action text NOT NULL,
  result text NOT NULL,
  evidence jsonb,
  completed_by text REFERENCES users(id) NOT NULL,
  completed_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS case_status_history (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) NOT NULL,
  from_status text NOT NULL,
  to_status text NOT NULL,
  "user" text REFERENCES users(id) NOT NULL,
  reason text,
  timestamp timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  actor_id text REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  metadata jsonb,
  timestamp timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS data_sources (
  id text PRIMARY KEY,
  provider text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  base_url text NOT NULL,
  status text DEFAULT 'CONFIGURED' NOT NULL,
  auth_type text DEFAULT 'OAUTH2' NOT NULL,
  freshness_class text DEFAULT 'NEAR_REAL_TIME',
  coverage text DEFAULT 'GLOBAL',
  latency_ms integer,
  last_successful_request timestamp,
  last_failure timestamp,
  last_error_message text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS fire_detections (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id),
  external_id text NOT NULL,
  latitude real NOT NULL,
  longitude real NOT NULL,
  brightness real,
  confidence text,
  frp real,
  satellite text,
  instrument text,
  acq_time timestamp,
  geometry jsonb NOT NULL,
  source text DEFAULT 'NASA_FIRMS',
  retrieved_at timestamp DEFAULT now() NOT NULL,
  raw_payload jsonb
);

CREATE TABLE IF NOT EXISTS imagery_pairs (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id) NOT NULL,
  before_imagery_id text REFERENCES imagery_assets(id) NOT NULL,
  after_imagery_id text REFERENCES imagery_assets(id) NOT NULL,
  overlap_percentage real DEFAULT 100,
  temporal_delta_hours real,
  status text DEFAULT 'VALIDATED' NOT NULL,
  created_by text REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS processing_jobs (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id),
  imagery_asset_id text REFERENCES imagery_assets(id),
  pair_id text REFERENCES imagery_pairs(id),
  provider text NOT NULL,
  job_type text NOT NULL,
  status text DEFAULT 'QUEUED' NOT NULL,
  started_at timestamp,
  completed_at timestamp,
  attempts integer DEFAULT 0,
  error_code text,
  error_message text,
  parameters jsonb DEFAULT '{}',
  result_metadata jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS osm_critical_assets (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id),
  osm_id text NOT NULL,
  osm_type text NOT NULL,
  name text NOT NULL,
  asset_type text NOT NULL,
  latitude real NOT NULL,
  longitude real NOT NULL,
  geometry jsonb NOT NULL,
  tags jsonb DEFAULT '{}',
  criticality_score integer DEFAULT 50,
  population_exposure_tier text DEFAULT 'Medium',
  source text DEFAULT 'OpenStreetMap',
  retrieved_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS external_feeds (
  id text PRIMARY KEY,
  source text NOT NULL,
  feed_type text NOT NULL,
  last_sync_at timestamp,
  last_event_id text,
  status text DEFAULT 'active',
  config jsonb,
  error_message text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS weather_alerts (
  id text PRIMARY KEY,
  external_id text UNIQUE,
  incident_id text REFERENCES incidents(id),
  alert_type text NOT NULL,
  severity text NOT NULL,
  headline text,
  description text,
  instruction text,
  area jsonb,
  effective_at timestamp,
  expires_at timestamp,
  source text,
  raw_payload jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS disaster_events (
  id text PRIMARY KEY,
  external_id text UNIQUE,
  source text NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  severity text,
  magnitude real,
  location jsonb,
  bounding_box jsonb,
  country text,
  population_exposed integer,
  source_url text,
  incident_id text REFERENCES incidents(id),
  raw_payload jsonb,
  event_time timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

-- AI & MLOps Infrastructure
CREATE TABLE IF NOT EXISTS model_versions (
  id text PRIMARY KEY,
  provider text NOT NULL,
  model text NOT NULL,
  version text NOT NULL,
  task text NOT NULL,
  status text DEFAULT 'ACTIVE' NOT NULL,
  parameters jsonb DEFAULT '{}',
  evaluation_metrics jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_decision_logs (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id),
  job_id text,
  incident_id text REFERENCES incidents(id),
  provider text NOT NULL,
  model text NOT NULL,
  model_version text NOT NULL,
  prompt_version text NOT NULL,
  input_hash text NOT NULL,
  output_hash text,
  result jsonb NOT NULL,
  damage_class text,
  confidence double precision,
  latency_ms integer,
  token_usage jsonb,
  reviewer_decision text DEFAULT 'PENDING',
  reviewer_notes text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_cache (
  id text PRIMARY KEY,
  input_hash text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL,
  schema_version text NOT NULL,
  response_payload jsonb NOT NULL,
  token_usage jsonb,
  latency_ms integer,
  hit_count integer DEFAULT 1 NOT NULL,
  expires_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_evaluation_dataset (
  id text PRIMARY KEY,
  incident_id text REFERENCES incidents(id),
  case_id text REFERENCES cases(id),
  source text NOT NULL,
  split text DEFAULT 'TEST' NOT NULL,
  input_data jsonb NOT NULL,
  ground_truth jsonb NOT NULL,
  model_prediction jsonb,
  confidence double precision,
  human_label text,
  outcome text,
  annotation_method text,
  version text DEFAULT 'v1.0.0' NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Transactional Outbox
CREATE TABLE IF NOT EXISTS outbox_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  incident_id text,
  organization_id text,
  version integer DEFAULT 1 NOT NULL,
  payload jsonb NOT NULL,
  actor_id text,
  occurred_at timestamp DEFAULT now() NOT NULL,
  published_at timestamp,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text,
  correlation_id text
);

CREATE INDEX IF NOT EXISTS idx_cases_incident ON cases(incident_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority_score);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_imagery_incident ON imagery_assets(incident_id);
CREATE INDEX IF NOT EXISTS idx_osm_assets_incident ON osm_critical_assets(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_case ON ai_decision_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_incident ON ai_decision_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_model_versions_task ON model_versions(task, status);
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished ON outbox_events(published_at) WHERE published_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_outbox_entity ON outbox_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fire_detections_incident ON fire_detections(incident_id);
CREATE INDEX IF NOT EXISTS idx_fire_detections_time ON fire_detections(acq_time);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);


INSERT INTO users (id, name, email, password_hash, role)
VALUES 
  ('usr-sysadmin', 'Sam SysAdmin', 'admin@draxelyra.local', '$2b$10$OXwkxMR5kG6zirq7x7FpkO5tAnvyPjOdYjOewP7PGpxZb9f4IqKki', 'System Admin'),
  ('usr-analyst', 'Alice Analyst', 'analyst@draxelyra.local', '$2b$10$OXwkxMR5kG6zirq7x7FpkO5tAnvyPjOdYjOewP7PGpxZb9f4IqKki', 'Analyst'),
  ('usr-commander', 'Cole Commander', 'commander@draxelyra.local', '$2b$10$OXwkxMR5kG6zirq7x7FpkO5tAnvyPjOdYjOewP7PGpxZb9f4IqKki', 'Commander'),
  ('usr-manager', 'Mary Manager', 'manager@draxelyra.local', '$2b$10$OXwkxMR5kG6zirq7x7FpkO5tAnvyPjOdYjOewP7PGpxZb9f4IqKki', 'Manager'),
  ('usr-field', 'Frank Field', 'field@draxelyra.local', '$2b$10$OXwkxMR5kG6zirq7x7FpkO5tAnvyPjOdYjOewP7PGpxZb9f4IqKki', 'Field Responder')
ON CONFLICT (id) DO NOTHING;

INSERT INTO incidents (id, name, disaster_type, status, description, severity, source, aoi)
VALUES
  ('inc-fl-chennai-2026', 'Cyclone Cyclone Varsha & Coastal Flood', 'Flood', 'Active', 'Major urban and coastal inundation impacting metropolitan corridor.', 'CRITICAL', 'NASA EONET / Sentinel-1', '{"type":"Polygon","coordinates":[[[80.15,13.0],[80.3,13.0],[80.3,13.15],[80.15,13.15],[80.15,13.0]]]}'),
  ('inc-chennai-demo', 'Chennai Urban Flood — Replay & Live Monitoring', 'Flood', 'Active', 'Operational multi-hazard response queue for metropolitan corridor.', 'CRITICAL', 'Sentinel-1 SAR / USGS / GDACS', '{"type":"Polygon","coordinates":[[[80.15,13.0],[80.3,13.0],[80.3,13.15],[80.15,13.15],[80.15,13.0]]]}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO imagery_assets (id, incident_id, external_product_id, provider, collection, title, source, acquisition_time, geometry, quality_status, processing_status, data_mode)
VALUES
  ('img-demo-pre', 'inc-fl-chennai-2026', 'S1A_IW_GRDH_1SDV_20260816T123456_PRE', 'COPERNICUS_STAC', 'sentinel-1-grd', 'Pre-Event SAR Baseline — Sentinel-1A', 'COPERNICUS_CDSE', now() - interval '8 days', '{"type":"Polygon","coordinates":[[[80.15,12.95],[80.32,12.95],[80.32,13.15],[80.15,13.15],[80.15,12.95]]]}', 'READY', 'PROCESSED', 'REAL'),
  ('img-demo-post', 'inc-fl-chennai-2026', 'S1A_IW_GRDH_1SDV_20260828T123456_POST', 'COPERNICUS_STAC', 'sentinel-1-grd', 'Post-Event SAR Assessment — Sentinel-1A', 'COPERNICUS_CDSE', now(), '{"type":"Polygon","coordinates":[[[80.15,12.95],[80.32,12.95],[80.32,13.15],[80.15,13.15],[80.15,12.95]]]}', 'READY', 'PROCESSED', 'REAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO critical_assets (id, name, type, location, criticality_score, population_exposure_tier, osm_id)
VALUES
  ('ast-hospital-01', 'Government General Hospital', 'Hospital', '{"type":"Point","coordinates":[80.2707,13.0827]}', 100, 'High', 'osm-hosp-1'),
  ('ast-bridge-01', 'Saidapet Bridge', 'Bridge', '{"type":"Point","coordinates":[80.2230,13.0210]}', 85, 'Medium', 'osm-bridge-1'),
  ('ast-school-01', 'Corporation Higher Secondary School', 'School', '{"type":"Point","coordinates":[80.2520,13.0490]}', 70, 'High', 'osm-school-1'),
  ('ast-substation-01', 'Adyar 230kV Substation', 'Utility', '{"type":"Point","coordinates":[80.2570,13.0060]}', 75, 'Medium', 'osm-util-1'),
  ('ast-residential-01', 'Saidapet Metro Colony', 'Residential', '{"type":"Point","coordinates":[80.2280,13.0350]}', 50, 'High', 'osm-res-1'),
  ('ast-taluk-01', 'Mylapore Taluk Office', 'Government', '{"type":"Point","coordinates":[80.2670,13.0330]}', 60, 'Low', 'osm-gov-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO detections (id, incident_id, imagery_id, geometry, class, severity, confidence, model_name, model_version, inference_timestamp)
VALUES
  ('det-case-hero-hospital', 'inc-fl-chennai-2026', 'img-demo-post', '{"type":"Point","coordinates":[80.2707,13.0827]}', 'Flood inundation', 'Severe', 0.94, 'Sentinel-1 SAR Flood Classifier', 'v2.4.1', now()),
  ('det-case-bridge-01', 'inc-fl-chennai-2026', 'img-demo-post', '{"type":"Point","coordinates":[80.2230,13.0210]}', 'Structure damage', 'Severe', 0.88, 'Sentinel-1 SAR Flood Classifier', 'v2.4.1', now()),
  ('det-case-school-01', 'inc-fl-chennai-2026', 'img-demo-post', '{"type":"Point","coordinates":[80.2520,13.0490]}', 'Roof damage', 'Moderate', 0.71, 'Sentinel-1 SAR Flood Classifier', 'v2.4.1', now()),
  ('det-case-substation-01', 'inc-fl-chennai-2026', 'img-demo-post', '{"type":"Point","coordinates":[80.2570,13.0060]}', 'Inundation', 'Minor', 0.79, 'Sentinel-1 SAR Flood Classifier', 'v2.4.1', now()),
  ('det-case-residential-01', 'inc-fl-chennai-2026', 'img-demo-post', '{"type":"Point","coordinates":[80.2280,13.0350]}', 'Standing water', 'Moderate', 0.92, 'Sentinel-1 SAR Flood Classifier', 'v2.4.1', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO cases (id, incident_id, detection_id, asset_id, status, priority_score, priority_breakdown, review_state, data_mode)
VALUES
  ('case-hero-hospital', 'inc-fl-chennai-2026', 'det-case-hero-hospital', 'ast-hospital-01', 'NEEDS_REVIEW', 88.5, '[{"label":"Critical facility (Hospital)","value":25},{"label":"Severe observed change","value":22.5},{"label":"High population exposure","value":18},{"label":"Urgency","value":14},{"label":"High confidence (94%)","value":9.0}]', 'UNREVIEWED', 'REAL'),
  ('case-bridge-01', 'inc-fl-chennai-2026', 'det-case-bridge-01', 'ast-bridge-01', 'TASKED', 79.2, '[{"label":"Bridge criticality","value":21.25},{"label":"Severe observed change","value":22.5},{"label":"Medium exposure","value":11},{"label":"Urgency","value":14},{"label":"High confidence (88%)","value":8.8}]', 'CONFIRMED', 'REAL'),
  ('case-school-01', 'inc-fl-chennai-2026', 'det-case-school-01', 'ast-school-01', 'VERIFIED', 62.4, '[{"label":"School criticality","value":17.5},{"label":"Moderate observed change","value":13.5},{"label":"High exposure","value":18},{"label":"Urgency","value":7},{"label":"High confidence (71%)","value":7.1}]', 'CONFIRMED', 'REAL'),
  ('case-substation-01', 'inc-fl-chennai-2026', 'det-case-substation-01', 'ast-substation-01', 'NEEDS_REVIEW', 48.0, '[{"label":"Utility criticality","value":18.75},{"label":"Minor observed change","value":6},{"label":"Medium exposure","value":11},{"label":"Urgency","value":4},{"label":"Confidence (79%)","value":7.9}]', 'UNREVIEWED', 'REAL'),
  ('case-residential-01', 'inc-fl-chennai-2026', 'det-case-residential-01', 'ast-residential-01', 'NEEDS_REVIEW', 56.1, '[{"label":"Residential criticality","value":10},{"label":"Moderate observed change","value":13.5},{"label":"High exposure","value":18},{"label":"Urgency","value":5},{"label":"High confidence (92%)","value":9.2}]', 'UNREVIEWED', 'REAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, case_id, title, priority, assigned_team, assigned_user, status, due_at)
VALUES
  ('task-hero', 'case-hero-hospital', 'Verify hospital ground-floor inundation and access clearance', 89, 'Field Verification Team 01', 'usr-field', 'ASSIGNED', now() + interval '45 minutes'),
  ('task-bridge', 'case-bridge-01', 'Inspect structural integrity and establish river traffic barrier', 79, 'Infrastructure Response Cell', 'usr-field', 'IN_PROGRESS', now() - interval '15 minutes'),
  ('task-school', 'case-school-01', 'Confirm evacuation shelter suitability and roof integrity', 62, 'Field Verification Team 04', 'usr-field', 'COMPLETED', now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;
`;
