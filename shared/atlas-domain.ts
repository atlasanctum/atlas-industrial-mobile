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
  "role:manage",
] as const;
export type AtlasPermission = (typeof atlasPermissions)[number];

const rolePermissions: Record<AtlasRole, readonly AtlasPermission[]> = {
  operator: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "intelligence:ask", "recommendation:request"],
  technician: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "intelligence:ask", "recommendation:request"],
  inspector: ["workspace:view", "asset:view", "work:view", "event:record", "scan:record", "intelligence:ask", "recommendation:request"],
  manager: ["workspace:view", "asset:view", "work:view", "work:act", "event:record", "scan:record", "intelligence:ask", "recommendation:request", "recommendation:approve"],
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
