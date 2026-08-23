---
id: schema
title: Database Schema
sidebar_position: 2
---

# Database Schema Reference

<span className="badge-implemented">Implemented</span>

The complete schema is defined in `lib/db/src/schema/index.ts`.

---

## Core Tables

### 1. `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Unique user ID |
| `name` | `text` | NOT NULL | User's full name |
| `email` | `text` | NOT NULL, UNIQUE | User email address |
| `password_hash` | `text` | NOT NULL | Bcrypt hashed password |
| `role` | `text` | NOT NULL | System / operational role |
| `organization_id` | `text` | NULLABLE | Associated organization ID |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Record creation time |

### 2. `incidents`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Unique incident identifier |
| `name` | `text` | NOT NULL | Operation title |
| `disaster_type` | `text` | NOT NULL | Hazard category (e.g., Urban flood) |
| `status` | `text` | NOT NULL | Operational status (Active, Closed) |
| `start_time` | `timestamp` | NULLABLE | Incident start timestamp |
| `end_time` | `timestamp` | NULLABLE | Incident closure timestamp |
| `aoi` | `jsonb` | NULLABLE | GeoJSON Area of Interest boundary |
| `source` | `text` | NULLABLE | Ingestion source identifier |
| `description` | `text` | NULLABLE | Incident summary |
| `severity` | `text` | NULLABLE | Operational severity rating |
| `created_by` | `text` | REFERENCES `users(id)` | Creator user ID |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Timestamp |

### 3. `critical_assets`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Asset identifier |
| `name` | `text` | NOT NULL | Facility name (e.g. General Hospital) |
| `type` | `text` | NOT NULL | Infrastructure type (Hospital, Bridge, Utility) |
| `location` | `jsonb` | NOT NULL | Lat/Lng coordinates `{lat, lng}` |
| `criticality_score`| `integer` | NOT NULL | Inherent asset importance (0–100) |
| `population_exposure_tier` | `text` | NOT NULL | Vulnerability tier (High, Medium, Low) |

### 4. `detections`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Detection identifier |
| `incident_id` | `text` | REFERENCES `incidents(id)` | Incident context |
| `imagery_id` | `text` | REFERENCES `imagery_assets(id)`| Source imagery pass |
| `geometry` | `jsonb` | NOT NULL | GeoJSON geometry / point |
| `class` | `text` | NOT NULL | Damage class (Structure damage, etc.) |
| `severity` | `text` | NOT NULL | Observed severity tier |
| `confidence` | `doublePrecision` | NOT NULL | Model statistical confidence (0.0–1.0) |
| `model_name` | `text` | NOT NULL | AI model identifier |
| `model_version` | `text` | NOT NULL | Model release version (e.g., v2.4.1) |
| `inference_timestamp` | `timestamp` | NOT NULL | Inference execution timestamp |

### 5. `cases`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Case identifier (e.g. C-1048) |
| `incident_id` | `text` | REFERENCES `incidents(id)` | Incident context |
| `detection_id` | `text` | REFERENCES `detections(id)` | Linked AI detection |
| `asset_id` | `text` | REFERENCES `critical_assets(id)` | Linked critical facility |
| `status` | `text` | NOT NULL | Lifecycle state (`NEEDS_REVIEW`, etc.) |
| `priority_score`| `doublePrecision` | NULLABLE | Computed priority score (0–100) |
| `priority_breakdown` | `jsonb` | NULLABLE | Multi-factor component values |
| `review_state` | `text` | NOT NULL | Human review state (`PENDING`, etc.) |
| `owner` | `text` | REFERENCES `users(id)` | Assigned case owner |
| `version` | `integer` | NOT NULL, DEFAULT 1 | Optimistic concurrency version |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Last mutation timestamp |

### 6. `tasks`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Task identifier |
| `case_id` | `text` | REFERENCES `cases(id)` | Linked operational case |
| `title` | `text` | NOT NULL | Action order title |
| `description` | `text` | NULLABLE | Detailed tactical instructions |
| `priority` | `integer` | NOT NULL | Task priority score (inherited) |
| `assigned_team`| `text` | NULLABLE | Target response group |
| `assigned_user`| `text` | REFERENCES `users(id)` | Specific assignee |
| `status` | `text` | NOT NULL | Task status (`UNASSIGNED`, etc.) |
| `version` | `integer` | NOT NULL, DEFAULT 1 | OCC version |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | Dispatch timestamp |
| `due_at` | `timestamp` | NULLABLE | SLA expiration timestamp |
| `escalation_at`| `timestamp` | NULLABLE | Escalation trigger timestamp |
| `completed_at` | `timestamp` | NULLABLE | Completion timestamp |

### 7. `evidence`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Evidence artifact ID |
| `case_id` | `text` | REFERENCES `cases(id)` | Linked case |
| `type` | `text` | NOT NULL | Media type (Image, Video, Sensor) |
| `uri` | `text` | NOT NULL | Static download URI |
| `source` | `text` | NOT NULL | Upload origin (Field Upload, Drone) |
| `mime_type` | `text` | NULLABLE | Validated MIME type |
| `size` | `integer` | NULLABLE | Byte size |
| `checksum` | `text` | NULLABLE | SHA-256 binary hash |
| `metadata` | `jsonb` | NULLABLE | EXIF & location metadata |
| `created_by` | `text` | REFERENCES `users(id)` | Uploader ID |
| `timestamp` | `timestamp` | NOT NULL, DEFAULT NOW() | Upload timestamp |

### 8. `audit_events`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | PRIMARY KEY | Unique audit log ID |
| `actor_id` | `text` | REFERENCES `users(id)` | Acting user ID |
| `entity_type` | `text` | NOT NULL | Entity domain (`CASE`, `TASK`, `INCIDENT`) |
| `entity_id` | `text` | NOT NULL | Target entity ID |
| `action` | `text` | NOT NULL | Action string (e.g. `TRANSITIONED_TO_CONFIRMED`) |
| `metadata` | `jsonb` | NULLABLE | Payload / state diff |
| `timestamp` | `timestamp` | NOT NULL, DEFAULT NOW() | Event timestamp |
