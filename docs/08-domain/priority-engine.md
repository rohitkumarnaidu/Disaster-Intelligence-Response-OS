---
id: priority-engine
title: Explainable Priority Engine
sidebar_position: 5
---

# Explainable Priority Engine

<span className="badge-implemented">Implemented</span>

The Priority Engine (`artifacts/api-server/src/lib/priority.ts`) evaluates operational urgency through a deterministic mathematical model.

---

## Mathematical Formula

```
Priority = round(0.30 * S + 0.25 * C + 0.20 * E + 0.15 * U + 0.10 * ConfidenceInput)
```

Where:
- **S** (0 to 100): Structural Severity Score
- **C** (0 to 100): Facility Criticality Score
- **E** (0 to 100): Population Exposure Score
- **U** (0 to 100): Urgency & Access Score
- **ConfidenceInput** (0 to 100): Model Confidence (`confidence * 100`)

---

## Scoring Factor Tables

### 1. Structural Severity (S)
| Severity Tier | Value | Rationale |
| :--- | :--- | :--- |
| `Destroyed` | **100** | Catastrophic collapse / complete loss of function |
| `Severe` | **75** | Major structural failure / unpassable roadway |
| `Moderate` | **45** | Partial roof / wall damage, standing water |
| `Uncertain` | **35** | Obscured by cloud / smoke, requires investigation |
| `Minor` | **20** | Superficial cosmetic impact |
| `No damage` | **0** | Baseline intact |

### 2. Facility Criticality (C)
| Asset Type | Value |
| :--- | :--- |
| `Hospital` / `Emergency` | **100** |
| `Bridge` / Major Arterial | **85** |
| `Government` / `Utility` (Substation/Water) | **75** |
| `School` / Shelter Facility | **70** |
| `Residential` Zone | **40** |
| `Commercial` Property | **30** |

### 3. Population Exposure (E)
| Exposure Tier | Value |
| :--- | :--- |
| `High` | **90** |
| `Medium` | **55** |
| `Low` | **20** |

### 4. Urgency Score (U)
```
U = min(100, max(0, 100 - (hours / 72) * 100) + (accessConstrained ? 20 : 0))
```

---

## Canonical Test Case (Hero Case C-1048)

```typescript
const result = calculatePriority(
  "Severe",      // Severity = 75  => 0.30 * 75 = 22.5 pts
  "Hospital",    // Criticality = 100 => 0.25 * 100 = 25.0 pts
  "High",        // Exposure = 90  => 0.20 * 90 = 18.0 pts
  28.8,          // Urgency hours (28.8h elapsed) + accessConstrained => 12.0 pts
  true,          // Access constrained (+20)
  0.55           // Confidence = 55% => 0.10 * 55 = 5.5 pts
);

// Total = 22.5 + 25.0 + 18.0 + 12.0 + 5.5 = 83.0 (Score: 83)
```
