---
id: docker
title: Docker Deployment
sidebar_position: 2
---

# Docker & Containerization

<span className="badge-implemented">Implemented</span>

The bundled `docker-compose.yml` provisions PostgreSQL:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_HOST_AUTH_METHOD: trust
      POSTGRES_USER: postgres
      POSTGRES_DB: draxelyra
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```
