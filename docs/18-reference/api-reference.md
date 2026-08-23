# API Endpoints Summary Table

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/logout` | User logout |
| `GET` | `/api/auth/me` | Active session profile |
| `GET` | `/api/incidents` | List incidents |
| `POST` | `/api/incidents` | Create incident |
| `GET` | `/api/incidents/:id` | Get incident |
| `GET` | `/api/incidents/:id/map` | Aggregated GeoJSON map data |
| `GET` | `/api/cases` | Ranked priority queue |
| `GET` | `/api/cases/:id` | Case detail |
| `POST` | `/api/cases/:id/review` | Submit review decision |
| `GET` | `/api/cases/:id/audit` | Case audit events |
| `GET` | `/api/tasks` | Response tasks |
| `POST` | `/api/tasks` | Create response task |
| `PATCH` | `/api/tasks/:id` | Update task status |
| `POST` | `/api/evidence/upload` | Upload media artifact |
| `GET` | `/api/analytics/overview`| Operational metrics |
| `POST` | `/api/demo/load` | Load demo dataset |
