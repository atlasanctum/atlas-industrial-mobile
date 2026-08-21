export const atlasRoles = ["operator", "technician", "inspector", "manager", "executive", "auditor"] as const;
export type AtlasRole = (typeof atlasRoles)[number];

export const atlasPermissions = [
  "workspace:view",
  "asset:view",
  "work:view",
  "work:act",
  "event:record",
  "scan:record",
  "intelligence:ask",
  "recommendation:request",
  "recommendation:approve",
  "control:complete",
  "evidence:upload",
  "telemetry:view",
  "role:manage",
  "scenario:simulate",
  "policy:manage",
] as const;
export type AtlasPermission = (typeof atlasPermissions)[number];

const rolePermissions: Record<AtlasRole, readonly AtlasPermission[]> = {
  operator: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request", "scenario:simulate"],
  technician: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request", "scenario:simulate"],
  inspector: ["workspace:view", "asset:view", "work:view", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request", "scenario:simulate"],
  manager: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request", "recommendation:approve", "scenario:simulate"],
  executive: [...atlasPermissions],
  auditor: ["workspace:view", "asset:view", "work:view"],
};

export function hasAtlasPermission(role: AtlasRole, permission: AtlasPermission) {
  return rolePermissions[role].includes(permission);
}

export function permissionsForRole(role: AtlasRole) {
  return [...rolePermissions[role]];
}

export type AtlasMember = {
  id: string;
  manusUserId: number;
  displayName: string;
  role: AtlasRole;
  facilityIds: string[];
  active: boolean;
};

export type AtlasEventInput = {
  clientEventId: string;
  eventType: "asset_scanned" | "work_started" | "work_completed" | "inspection_recorded" | "issue_reported" | "evidence_captured";
  entityType: "asset" | "work_item" | "inspection" | "issue";
  entityId: string;
  occurredAt: string;
  facilityId?: string;
  payload: Record<string, unknown>;
};

export type GroundedRecommendation = {
  id: string;
  situation: string;
  evidence: string[];
  options: string[];
  tradeoffs: string[];
  recommendation: string;
  confidence: "low" | "medium" | "high";
  authorizationRole: AtlasRole;
  expectedOutcome: string;
  citations: { recordType: string; recordId: string; label: string }[];
};

export type AtlasOperationalControl = {
  id: string;
  facilityId?: string;
  assetId?: string;
  domain: "production" | "inventory" | "quality" | "safety";
  title: string;
  context: string;
  detail: string;
  status: "ready" | "attention" | "blocked" | "verified";
  severity: "normal" | "attention" | "high" | "critical";
  requiredEvidence: boolean;
};

export type AtlasEvidenceDraft = {
  id: string;
  eventClientId: string;
  localUri: string;
  contentType: string;
  filename: string;
  sizeBytes: number;
  entityType: AtlasEventInput["entityType"];
  entityId: string;
  createdAt: string;
  status: "pending_upload" | "uploaded" | "failed";
  remoteUrl?: string;
  attempts: number;
};

export const atlasEvidenceContentTypes = ["image/jpeg", "image/png", "image/heic", "audio/m4a", "audio/mp4", "audio/webm"] as const;
export type AtlasEvidenceContentType = (typeof atlasEvidenceContentTypes)[number];

export function isAllowedEvidenceContentType(contentType: string): contentType is AtlasEvidenceContentType {
  return atlasEvidenceContentTypes.includes(contentType as AtlasEvidenceContentType);
}

export type AtlasTelemetryReading = {
 id: string;
 assetId: string;
 facilityId?: string;
  metric: AtlasTelemetryMetric;
 value: number;
 observedAt: string;
};

export const atlasTelemetryMetrics = ["temperature_c", "vibration_mm_s", "runtime_hours", "pressure_bar"] as const;
export type AtlasTelemetryMetric = (typeof atlasTelemetryMetrics)[number];

export function isValidTelemetryReading(reading: Pick<AtlasTelemetryReading, "assetId" | "metric" | "value" | "observedAt">) {
  return reading.assetId.trim().length > 0 && atlasTelemetryMetrics.includes(reading.metric) && Number.isFinite(reading.value) && reading.value >= 0 && Number.isFinite(Date.parse(reading.observedAt));
}

export type AtlasMaintenanceSignal = {
  assetId: string;
  metric: AtlasTelemetryReading["metric"];
  observedValue: number;
  risk: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  explanation: string;
  recommendedAction: string;
};

const telemetryThresholds: Record<AtlasTelemetryReading["metric"], { medium: number; high: number; unit: string; action: string }> = {
  temperature_c: { medium: 72, high: 82, unit: "°C", action: "Inspect the cooling path before the next production release." },
  vibration_mm_s: { medium: 5, high: 7, unit: "mm/s", action: "Inspect bearing condition and verify mounting before continued duty." },
  runtime_hours: { medium: 450, high: 500, unit: "h", action: "Schedule preventive service before the next planned operating window." },
  pressure_bar: { medium: 8, high: 10, unit: "bar", action: "Verify pressure controls and isolate the asset if the reading persists." },
};

export function deriveMaintenanceSignal(readings: AtlasTelemetryReading[]): AtlasMaintenanceSignal | null {
  if (readings.length === 0) return null;
  const ordered = [...readings].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  const latest = ordered[0];
  const threshold = telemetryThresholds[latest.metric];
  const risk = latest.value >= threshold.high ? "high" : latest.value >= threshold.medium ? "medium" : "low";
  const recentSameMetric = ordered.filter((reading) => reading.metric === latest.metric).slice(0, 3);
  const confidence = recentSameMetric.length >= 3 ? "high" : recentSameMetric.length >= 2 ? "medium" : "low";
  return {
    assetId: latest.assetId,
    metric: latest.metric,
    observedValue: latest.value,
    risk,
    confidence,
    explanation: risk === "low" ? `${latest.metric} is within the configured observation band at ${latest.value}${threshold.unit}.` : `${latest.metric} is ${risk === "high" ? "above" : "approaching"} the configured maintenance threshold at ${latest.value}${threshold.unit}.`,
    recommendedAction: risk === "low" ? "Continue observation and retain the reading in the asset history." : threshold.action,
  };
}

export function normalizeGroundedRecommendation(input: Partial<Omit<GroundedRecommendation, "id">>, id: string): GroundedRecommendation {
  return {
    id,
    situation: String(input.situation ?? "Evidence review incomplete."),
    evidence: Array.isArray(input.evidence) ? input.evidence.map(String) : [],
    options: Array.isArray(input.options) ? input.options.map(String) : [],
    tradeoffs: Array.isArray(input.tradeoffs) ? input.tradeoffs.map(String) : [],
    recommendation: String(input.recommendation ?? "No recommendation available."),
    confidence: input.confidence === "high" || input.confidence === "medium" ? input.confidence : "low",
    authorizationRole: input.authorizationRole && atlasRoles.includes(input.authorizationRole) ? input.authorizationRole : "manager",
    expectedOutcome: String(input.expectedOutcome ?? "Outcome must be verified after authorized execution."),
    citations: Array.isArray(input.citations) ? input.citations.filter((citation): citation is GroundedRecommendation["citations"][number] => Boolean(citation && typeof citation.recordType === "string" && typeof citation.recordId === "string" && typeof citation.label === "string")) : [],
  };
}

export const atlasEvidenceStates = ["verified", "likely", "estimated", "unknown"] as const;
export type AtlasEvidenceState = (typeof atlasEvidenceStates)[number];

export const atlasOperatingStates = ["normal", "watch", "at_risk", "critical"] as const;
export type AtlasOperatingState = (typeof atlasOperatingStates)[number];

export type AtlasHealthDimension = {
  id: "production" | "capacity" | "inventory" | "logistics" | "quality" | "safety" | "finance" | "projects" | "resilience";
  label: string;
  value: number;
  state: AtlasOperatingState;
  evidenceState: AtlasEvidenceState;
  explanation: string;
};

export type AtlasDigitalTwin = {
  assetId: string;
  title: string;
  facility: string;
  line: string;
  currentState: string;
  historicalState: string;
  expectedState: string;
  predictedState: string;
  recommendation: string;
  evidenceState: AtlasEvidenceState;
  linkedEventIds: string[];
};

export type AtlasCausalLink = {
  id: string;
  observation: string;
  contributor: string;
  cause: string;
  verification: string;
  evidenceState: AtlasEvidenceState;
  citations: { recordType: string; recordId: string; label: string }[];
};

export type AtlasMemoryEntry = {
  id: string;
  timestamp: string;
  event: string;
  decision: string;
  outcome: string;
  lesson: string;
  owner: string;
  evidenceState: AtlasEvidenceState;
  linkedAssetId?: string;
  linkedEventIds: string[];
};

export type AtlasScenario = {
  id: string;
  title: string;
  premise: string;
  scope: "facility" | "line" | "asset" | "enterprise";
  expectedProduction: string;
  deliveryImpact: string;
  marginImpact: string;
  riskState: AtlasOperatingState;
  recommendation: string;
  evidenceState: AtlasEvidenceState;
  requiredRole: AtlasRole;
};

export const atlasAgentRoles = ["operations", "asset", "supply", "logistics", "finance", "quality", "safety", "project", "executive"] as const;
export type AtlasAgentRole = (typeof atlasAgentRoles)[number];

export type AtlasAgentFinding = {
  agent: AtlasAgentRole;
  title: string;
  finding: string;
  evidenceState: AtlasEvidenceState;
  riskState: AtlasOperatingState;
  linkedRecordIds: string[];
};

export type AtlasApprovalPolicy = {
  id: string;
  title: string;
  risk: "low" | "medium" | "high" | "critical";
  requiredRoles: AtlasRole[];
  autoExecute: boolean;
  description: string;
};

export function operatingStateFor(value: number): AtlasOperatingState {
  if (value >= 90) return "normal";
  if (value >= 75) return "watch";
  if (value >= 55) return "at_risk";
  return "critical";
}

export function weightedIndustrialHealth(dimensions: AtlasHealthDimension[]) {
  if (dimensions.length === 0) return { value: 0, state: "critical" as const };
  const value = Math.round(dimensions.reduce((total, dimension) => total + dimension.value, 0) / dimensions.length);
  return { value, state: operatingStateFor(value) };
}

export function explainableRiskScore({ probability, impact, exposure, detectability }: { probability: number; impact: number; exposure: number; detectability: number }) {
  const inputs = [probability, impact, exposure, detectability].map((value) => Math.min(100, Math.max(0, value)));
  const score = Math.round((inputs[0] * 0.3) + (inputs[1] * 0.35) + (inputs[2] * 0.2) + (inputs[3] * 0.15));
  return { score, state: score >= 75 ? "critical" as const : score >= 55 ? "at_risk" as const : score >= 30 ? "watch" as const : "normal" as const };
}
