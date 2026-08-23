export type DemoCase = {
  id: string;
  incidentId: string;
  title: string;
  assetType: string;
  assetName: string;
  severity: string;
  confidence: number;
  priorityScore: number;
  reviewState: string;
  status: string;
  inferenceBadge: string;
  location: { lat: number; lng: number };
  factors: { label: string; value: number }[];
  imagery: { before: string; after: string };
  owner: string | null;
  dueAt: string | null;
};

export type DemoTask = {
  id: string;
  caseId: string;
  title: string;
  assignedTeam: string;
  assignedUser: string | null;
  status: string;
  priority: number;
  dueAt: string;
  slaLabel: string;
  escalation: boolean;
};

export const incident = {
  id: "inc-chennai-demo",
  name: "Chennai Urban Flood — Demo Replay",
  disasterType: "Urban flood",
  status: "Active",
  severity: "High",
  source: "DEMO REPLAY / HISTORICAL",
  description: "Fictionalized historical monsoon scenario for operational demonstration.",
  aoi: { type: "Polygon", coordinates: [[[80.15, 13.0], [80.3, 13.0], [80.3, 13.15], [80.15, 13.15], [80.15, 13.0]]] },
  startTime: "2024-12-04T04:30:00.000Z",
  updatedAt: new Date().toISOString(),
};

const heroFactors = [
  { label: "Critical facility (Hospital)", value: 25 },
  { label: "Severe observed change", value: 22.5 },
  { label: "High population exposure", value: 18 },
  { label: "Time-sensitive / access limited", value: 12 },
  { label: "Moderate model confidence (55%)", value: 5.5 },
];

export const cases: DemoCase[] = [
  {
    id: "case-hero-hospital", incidentId: incident.id, title: "Flood impact at Government General Hospital",
    assetType: "Hospital", assetName: "Government General Hospital", severity: "Severe", confidence: 0.55,
    priorityScore: 83, reviewState: "Needs review", status: "review", inferenceBadge: "MOCK INFERENCE",
    location: { lat: 13.0827, lng: 80.2707 }, factors: heroFactors,
    imagery: { before: "BASELINE / 2024-11-18", after: "POST-EVENT / 2024-12-04" }, owner: "Asha Raman", dueAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
  },
  { id: "case-bridge-01", incidentId: incident.id, title: "Roadway obstruction at Saidapet bridge", assetType: "Bridge", assetName: "Saidapet Bridge", severity: "Severe", confidence: 0.88, priorityScore: 79, reviewState: "Confirmed", status: "tasked", inferenceBadge: "DEMO REPLAY", location: { lat: 13.021, lng: 80.223 }, factors: [{ label: "Bridge criticality", value: 21.25 }, { label: "Severe observed change", value: 22.5 }, { label: "Medium exposure", value: 11 }, { label: "Urgency", value: 14 }, { label: "High confidence (88%)", value: 8.8 }], imagery: { before: "BASELINE / 2024-11-18", after: "POST-EVENT / 2024-12-04" }, owner: "Response Cell", dueAt: new Date(Date.now() + 54 * 60 * 1000).toISOString() },
  { id: "case-school-02", incidentId: incident.id, title: "Roof damage near Corporation School 14", assetType: "School", assetName: "Corporation School 14", severity: "Moderate", confidence: 0.71, priorityScore: 62, reviewState: "Confirmed", status: "verified", inferenceBadge: "MOCK INFERENCE", location: { lat: 13.049, lng: 80.252 }, factors: [{ label: "School criticality", value: 17.5 }, { label: "Moderate observed change", value: 13.5 }, { label: "High exposure", value: 18 }, { label: "Urgency", value: 7 }, { label: "High confidence (71%)", value: 7.1 }], imagery: { before: "BASELINE / 2024-11-18", after: "POST-EVENT / 2024-12-04" }, owner: "Field Team 04", dueAt: null },
  { id: "case-res-03", incidentId: incident.id, title: "Standing water across residential block", assetType: "Residential", assetName: "Saidapet Block C", severity: "Moderate", confidence: 0.92, priorityScore: 56, reviewState: "Needs review", status: "review", inferenceBadge: "MOCK INFERENCE", location: { lat: 13.035, lng: 80.228 }, factors: [{ label: "Residential criticality", value: 10 }, { label: "Moderate observed change", value: 13.5 }, { label: "High exposure", value: 18 }, { label: "Urgency", value: 5 }, { label: "High confidence (92%)", value: 9.2 }], imagery: { before: "BASELINE / 2024-11-18", after: "POST-EVENT / 2024-12-04" }, owner: null, dueAt: new Date(Date.now() + 105 * 60 * 1000).toISOString() },
  { id: "case-utility-04", incidentId: incident.id, title: "Substation access road inundated", assetType: "Utility", assetName: "Adyar Substation", severity: "Minor", confidence: 0.79, priorityScore: 48, reviewState: "Uncertain", status: "review", inferenceBadge: "DEMO REPLAY", location: { lat: 13.006, lng: 80.257 }, factors: [{ label: "Utility criticality", value: 18.75 }, { label: "Minor observed change", value: 6 }, { label: "Medium exposure", value: 11 }, { label: "Urgency", value: 4 }, { label: "Confidence (79%)", value: 7.9 }], imagery: { before: "BASELINE / 2024-11-18", after: "POST-EVENT / 2024-12-04" }, owner: null, dueAt: new Date(Date.now() + 405 * 60 * 1000).toISOString() },
  { id: "case-false-05", incidentId: incident.id, title: "False positive — reflective roof surface", assetType: "Commercial", assetName: "Mount Road Retail", severity: "No damage", confidence: 0.96, priorityScore: 28, reviewState: "Rejected", status: "closed", inferenceBadge: "MOCK INFERENCE", location: { lat: 13.034, lng: 80.242 }, factors: [{ label: "Commercial criticality", value: 7.5 }, { label: "No observed damage", value: 0 }, { label: "Medium exposure", value: 11 }, { label: "Urgency", value: 0 }, { label: "High confidence (96%)", value: 9.6 }], imagery: { before: "BASELINE / 2024-11-18", after: "POST-EVENT / 2024-12-04" }, owner: null, dueAt: null },
  { id: "case-gov-06", incidentId: incident.id, title: "Access restriction at Taluk office", assetType: "Government", assetName: "Mylapore Taluk Office", severity: "Minor", confidence: 0.64, priorityScore: 43, reviewState: "Confirmed", status: "tasked", inferenceBadge: "DEMO REPLAY", location: { lat: 13.033, lng: 80.267 }, factors: [{ label: "Government criticality", value: 18.75 }, { label: "Minor observed change", value: 6 }, { label: "Low exposure", value: 4 }, { label: "Urgency", value: 8 }, { label: "Confidence (64%)", value: 6.4 }], imagery: { before: "BASELINE / 2024-11-18", after: "POST-EVENT / 2024-12-04" }, owner: "Assessment Cell", dueAt: new Date(Date.now() + 245 * 60 * 1000).toISOString() },
];

export const tasks: DemoTask[] = [
  { id: "task-hero", caseId: "case-hero-hospital", title: "Verify hospital access and ground-floor impact", assignedTeam: "Field Verification Team 01", assignedUser: "Vikram S.", status: "Open", priority: 83, dueAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(), slaLabel: "00:18:42", escalation: false },
  { id: "task-bridge", caseId: "case-bridge-01", title: "Assess bridge obstruction and safe crossing", assignedTeam: "Infrastructure Response", assignedUser: "Naveen K.", status: "In progress", priority: 79, dueAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(), slaLabel: "OVERDUE", escalation: true },
  { id: "task-school", caseId: "case-school-02", title: "Confirm roof condition and evacuation access", assignedTeam: "Field Verification Team 04", assignedUser: "Meena R.", status: "Completed", priority: 62, dueAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), slaLabel: "SYNCED", escalation: false },
];

export function demoState() {
  return { incident, cases, tasks, heroCaseId: "case-hero-hospital" };
}