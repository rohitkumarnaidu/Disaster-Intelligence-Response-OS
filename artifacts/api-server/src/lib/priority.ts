export function calculatePriority(
  severity: string,
  criticalityType: string,
  exposureTier: string,
  hoursSinceIncident: number,
  accessConstrained: boolean,
  confidence: number
): { score: number; breakdown: any[] } {
  // Severity Score
  let severityScore = 0;
  switch (severity?.toLowerCase()) {
    case "no damage": severityScore = 0; break;
    case "minor": severityScore = 20; break;
    case "moderate": severityScore = 45; break;
    case "severe": severityScore = 75; break;
    case "destroyed": severityScore = 100; break;
    case "uncertain": severityScore = 35; break;
  }

  // Criticality Score
  let criticalityScore = 15;
  switch (criticalityType?.toLowerCase()) {
    case "hospital":
    case "emergency": criticalityScore = 100; break;
    case "bridge": criticalityScore = 85; break;
    case "gov":
    case "utility":
    case "substation":
    case "power":
    case "water":
    case "telecom": criticalityScore = 75; break;
    case "school": criticalityScore = 70; break;
    case "residential": criticalityScore = 40; break;
    case "commercial": criticalityScore = 30; break;
  }

  // Exposure Score
  let exposureScore = 20;
  switch (exposureTier?.toLowerCase()) {
    case "high": exposureScore = 90; break;
    case "medium": exposureScore = 55; break;
    case "low": exposureScore = 20; break;
  }

  // Urgency Score
  let urgencyScore = Math.max(0, Math.min(100, 100 - (hoursSinceIncident / 72) * 100)) + (accessConstrained ? 20 : 0);
  urgencyScore = Math.min(100, urgencyScore);

  // Confidence Input
  const confidenceInput = confidence * 100;

  // Final Formula
  const finalScore = Math.round(
    0.30 * severityScore +
    0.25 * criticalityScore +
    0.20 * exposureScore +
    0.15 * urgencyScore +
    0.10 * confidenceInput
  );

  const breakdown = [
    { label: "Severity", value: 0.30 * severityScore },
    { label: "Criticality", value: 0.25 * criticalityScore },
    { label: "Exposure", value: 0.20 * exposureScore },
    { label: "Urgency", value: 0.15 * urgencyScore },
    { label: "Confidence", value: 0.10 * confidenceInput },
  ];

  return { score: finalScore, breakdown };
}
