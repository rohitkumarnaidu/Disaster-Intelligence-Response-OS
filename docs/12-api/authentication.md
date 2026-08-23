# Authentication API

<span className="badge-implemented">Implemented</span>

### 1. `POST /api/auth/login`
- **Description**: Authenticates user credentials and issues a signed session cookie.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "analyst@draxelyra.local",
    "password": "demo123"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "id": "usr-analyst-01",
    "name": "Maya Chen",
    "email": "analyst@draxelyra.local",
    "role": "analyst",
    "organizationId": "org-tn-sdma"
  }
  ```

### 2. `GET /api/auth/me`
- **Description**: Retrieves current authenticated user profile.
- **Access**: Requires active session.
- **Success Response (`200 OK`)**: User profile object.

### 3. `POST /api/auth/logout`
- **Description**: Destroys current session in PostgreSQL store and clears client cookie.
- **Access**: Requires active session.
- **Success Response (`200 OK`)**: `{ "success": true }`
