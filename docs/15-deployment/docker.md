# Docker & Compose Architecture

<span className="badge-implemented">Implemented</span>

The `docker-compose.yml` configuration:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: draxelyra-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: draxelyra
    ports:
      - "5433:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```
