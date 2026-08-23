---
id: indexing
title: Indexing Strategy
sidebar_position: 5
---

# Indexing & Query Optimization

<span className="badge-implemented">Implemented</span>

1. `cases(incident_id, priority_score DESC)`
2. `tasks(case_id, status)`
3. `audit_events(entity_id, timestamp DESC)`
4. `session(sid, expire)`
