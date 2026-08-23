---
id: authentication
title: Auth Endpoints
sidebar_position: 2
---

# Authentication API Reference

### `POST /api/auth/login`
Authenticate with email and password.
- **Request Body**: `{ "email": "analyst@draxelyra.local", "password": "demo123" }`
- **Response (200)**: `{ "id": "usr-analyst", "name": "Alice Analyst", "email": "...", "role": "Analyst" }`
- **Set-Cookie**: `connect.sid=<session-id>; Path=/; HttpOnly; SameSite=Lax`

### `POST /api/auth/logout`
Terminates the active session.
- **Response (200)**: `{ "success": true }`

### `GET /api/auth/me`
Retrieves profile for current session.
- **Response (200)**: `{ "id": "usr-analyst", "name": "Alice Analyst", "email": "...", "role": "Analyst" }`
