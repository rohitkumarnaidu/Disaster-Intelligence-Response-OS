# Field Observations API

<span className="badge-implemented">Implemented</span>

### `POST /api/tasks/:id/field-observation`
- **Description**: Tactical personnel ground truth submission.
- **Request Body**:
  ```json
  {
    "taskId": "TSK-201",
    "observation": "Water receded by 1 foot; emergency backup generator functional.",
    "location": { "lat": 13.0827, "lng": 80.2707 },
    "evidenceIds": ["evi-8910"]
  }
  ```
