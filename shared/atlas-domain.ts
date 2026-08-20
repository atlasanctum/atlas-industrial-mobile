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
] as const;
export type AtlasPermission = (typeof atlasPermissions)[number];

const rolePermissions: Record<AtlasRole, readonly AtlasPermission[]> = {
  operator: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request"],
  technician: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request"],
  inspector: ["workspace:view", "asset:view", "work:view", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request"],
  manager: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "control:complete", "evidence:upload", "telemetry:view", "intelligence:ask", "recommendation:request", "recommendation:approve"],
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

export type AtlasTelemetryReading = {
  id: string;
  assetId: string;
  facilityId?: string;
  metric: "temperature_c" | "vibration_mm_s" | "runtime_hours" | "pressure_bar";
  value: number;
  observedAt: string;
};

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
