---
id: forms-validation
title: Forms & Adjudication Controls
sidebar_label: Forms & Validation
sidebar_position: 5
---

# Forms & Adjudication Controls

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces rigorous input validation across all operational forms to prevent corrupted state and malformed coordinates.

---

## 1. Case Adjudication Form (`/cases/:id`)
- **Required Fields**:
  - `decision`: Choice of `"CONFIRMED"`, `"REJECTED"`, or `"UNCERTAIN"`.
  - `notes`: Minimum 10 characters explaining operational reasoning.
  - `expectedVersion`: Read-only integer ensuring OCC validation.
- **Client Validation**: Disables submit button until notes meet length criteria and decision is selected.

## 2. Field Observation Form (`/field`)
- **Required Fields**:
  - `verificationStatus`: `"CONFIRMED_DAMAGED"`, `"NO_DAMAGE_FOUND"`, or `"INACCESSIBLE"`.
  - `location`: Latitude/Longitude populated via browser Geolocation API.
  - `media`: Optional photo file with magic-byte validation.
- **Offline Behavior**: Intercepts submit event, serializes payload to IndexedDB `syncQueue`, and renders a "Pending Sync" badge.
