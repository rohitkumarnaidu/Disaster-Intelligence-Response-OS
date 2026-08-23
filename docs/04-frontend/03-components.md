# UI Components & Map Engine

<span className="badge-implemented">Implemented</span>

## IncidentMap Deep-Dive

**Source:** `src/components/IncidentMap.tsx`

The `IncidentMap` is the most complex component in the application, leveraging `react-map-gl/maplibre` and `maplibre-gl` for high-performance vector rendering.

### Data Fetching
It fetches data using `GET /api/incidents/${incidentId}/map` with the query key `['incident-map', incidentId]`. This payload includes the AOI, critical assets, AI detections, and case data.

### Rendering Layers
The map renders 6 distinct GeoJSON layers to build the tactical picture:

1. **AOI Polygon**: 
   - Fill: `#259184` (opacity 0.1)
   - Border: Dashed
2. **Critical Assets**: 
   - Type: Circle (radius 8)
   - Color: `#4a5568`
3. **Detections (AI)**: 
   - Type: Circle (radius 4)
   - Color: `#cd372f`
4. **Cases**: 
   - Type: Circle (radius 6)
   - Color styling driven by status:
     - `NEEDS_REVIEW`: `#EFAC30` (Amber)
     - `CONFIRMED`: `#259184` (Teal)
     - `REJECTED`: `#cd372f` (Red)
     - `CLOSED`: `#8b9b95` (Slate)
5. **Field Observations**: 
   - Type: Circle (radius 5)
   - Color: `#259184`

### Interactivity
- **Case Click**: Navigates the user to `/cases/${id}`.
- **Asset Click**: Displays an alert or tooltip with the asset's name and type.

## UI Component Library

**Source:** `src/components/ui/`

The application utilizes 55 custom UI primitives built on top of **Radix UI**. This ensures accessibility (ARIA compliance, keyboard navigation) while allowing complete styling freedom via Tailwind CSS.

Key components include:
- `Button`, `Input`, `Dialog`, `DropdownMenu`, `Toast`, `Tooltip`, `Tabs`

## Design System

The design language reflects a tactical, high-contrast environment suitable for emergency operations centers (EOCs) and field devices.

### Typography
- **Body**: *DM Sans* (highly legible for dense data).
- **Display**: *Barlow Condensed* (used for dashboard metrics and headers).
- **Data/Coordinates**: *IBM Plex Mono* (monospace for lat/lng, IDs).

### Theme Tokens
- **Background**: Dark tactical slate (`#1a2332`)
- **Primary**: Teal (`#259184`)
- **Accent/Warning**: Amber (`#EFAC30`)
- **Destructive/Critical**: Red (`#cd372f`)\n