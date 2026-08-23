---
id: tasks
title: Tasks API
sidebar_position: 5
---

# Tasks API Reference

### `GET /api/tasks`
List all response tasks with dynamic SLA labels and escalation booleans.

### `POST /api/tasks`
Create an action order and transition the parent case to `TASKED`.
- **Request Body**: `{ "caseId": "C-1048", "title": "Check hospital access", "assignedTeam": "Field Team 1", "version": 1 }`
- **Response (201)**: `{ "id": "task-174000...", "status": "UNASSIGNED", "priority": 83, ... }`

### `PATCH /api/tasks/:id`
Update task status.
- **Request Body**: `{ "status": "VERIFIED", "version": 1 }`
- **Response (200)**: `{ "success": true, "version": 2 }`
