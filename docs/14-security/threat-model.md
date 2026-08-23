---
id: threat-model
title: Threat Model
sidebar_position: 9
---

# Threat Model & Mitigation Matrix

| Threat / Attack Vector | Risk | Mitigation in DRAXELYRA |
| :--- | :--- | :--- |
| **Concurrent Triage Overwrite** | Critical | Optimistic Concurrency Control (OCC) with atomic version CAS. |
| **Malicious File Upload** | High | Magic-byte signature verification, size limits (50MB), filename sanitization. |
| **Unauthorized Action Dispatch** | High | Route-level RBAC middleware (`requireRole`). |
| **Credential Compromise** | Medium | Bcrypt hashing + secure session expiration. |
| **SQL Injection** | Critical | Parameterized queries enforced by Drizzle ORM. |
