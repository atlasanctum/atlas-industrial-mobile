import { randomUUID } from "node:crypto";

import { invokeLLM, listLLMModels } from "./_core/llm";
import { storagePut } from "./storage";
import { isSupabaseConfigured, supabaseRequest } from "./supabase";
import {
  atlasTelemetryMetrics,
  atlasRoles,
  deriveMaintenanceSignal,
  hasAtlasPermission,
  isValidTelemetryReading,
  normalizeGroundedRecommendation,
  permissionsForRole,
  type AtlasEventInput,
  type AtlasEvidenceDraft,
  type AtlasMaintenanceSignal,
  type AtlasMember,
  type AtlasOperationalControl,
  type AtlasPermission,
  type AtlasRole,
  type AtlasTelemetryReading,
  type GroundedRecommendation,
} from "../shared/atlas-domain";

type SupabaseMemberRow = {
  id: string;
  manus_user_id: number;
  display_name: string | null;
  role: AtlasRole;
  facility_ids: string[] | null;
  active: boolean;
};

type AtlasRecord = Record<string, unknown>;

function mapMember(row: SupabaseMemberRow): AtlasMember {
  return {
    id: row.id,
    manusUserId: row.manus_user_id,
    displayName: row.display_name ?? "Atlas member",
    role: atlasRoles.includes(row.role) ? row.role : "operator",
    facilityIds: row.facility_ids ?? [],
    active: row.active,
  };
}

export async function getAtlasMember(manusUserId: number) {
  const rows = await supabaseRequest<SupabaseMemberRow[]>({
    path: `atlas_members?manus_user_id=eq.${encodeURIComponent(String(manusUserId))}&select=id,manus_user_id,display_name,role,facility_ids,active&limit=1`,
    method: "GET",
  });
  const member = rows[0] ? mapMember(rows[0]) : null;
  return member?.active ? member : null;
}

export function requireAtlasPermission(member: AtlasMember | null, permission: AtlasPermission) {
  if (!member) throw new Error("Atlas access is awaiting a role assignment.");
  if (!hasAtlasPermission(member.role, permission)) throw new Error("Your Atlas role is not authorized for this action.");
  return member;
}

function filterByFacility(records: AtlasRecord[], member: AtlasMember) {
  if (member.facilityIds.length === 0) return records;
  return records.filter((record) => {
    const facilityId = record.facility_id;
    return typeof facilityId !== "string" || member.facilityIds.includes(facilityId);
  });
}

function toOperationalControl(record: AtlasRecord): AtlasOperationalControl | null {
  const domain = record.domain;
  const status = record.status;
  const severity = record.severity;
  if ((domain !== "production" && domain !== "inventory" && domain !== "quality" && domain !== "safety") || (status !== "ready" && status !== "attention" && status !== "blocked" && status !== "verified") || (severity !== "normal" && severity !== "attention" && severity !== "high" && severity !== "critical") || typeof record.id !== "string") return null;
  return {
    id: record.id,
    facilityId: typeof record.facility_id === "string" ? record.facility_id : undefined,
    assetId: typeof record.asset_id === "string" ? record.asset_id : undefined,
    domain,
    title: typeof record.title === "string" ? record.title : "Unnamed operational control",
    context: typeof record.context === "string" ? record.context : "Facility context pending",
    detail: typeof record.detail === "string" ? record.detail : "Operational detail pending",
    status,
    severity,
    requiredEvidence: record.required_evidence === true,
  };
}

function toTelemetryReading(record: AtlasRecord): AtlasTelemetryReading | null {
  const metric = record.metric;
  if (typeof record.id !== "string" || typeof record.asset_id !== "string" || typeof metric !== "string" || !atlasTelemetryMetrics.includes(metric as AtlasTelemetryReading["metric"]) || typeof record.value !== "number" || typeof record.observed_at !== "string") return null;
  const reading = { id: record.id, assetId: record.asset_id, facilityId: typeof record.facility_id === "string" ? record.facility_id : undefined, metric, value: record.value, observedAt: record.observed_at };
  return isValidTelemetryReading(reading as AtlasTelemetryReading) ? reading as AtlasTelemetryReading : null;
}

export async function getAtlasWorkspace(manusUserId: number) {
  if (!isSupabaseConfigured()) {
    return { status: "not_configured" as const, member: null, permissions: [], assets: [], workItems: [], events: [], approvals: [], recommendations: [], operationalControls: [], telemetry: [], maintenanceSignals: [] as AtlasMaintenanceSignal[] };
  }
  const member = await getAtlasMember(manusUserId);
  if (!member) {
    return { status: "awaiting_role" as const, member: null, permissions: [], assets: [], workItems: [], events: [], approvals: [], recommendations: [], operationalControls: [], telemetry: [], maintenanceSignals: [] as AtlasMaintenanceSignal[] };
  }
  const [assets, workItems, events, approvals, recommendations, controls, telemetry] = await Promise.all([
    supabaseRequest<AtlasRecord[]>({ path: "atlas_assets?select=*&order=updated_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_work_items?select=*&order=updated_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_events?select=*&order=occurred_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_approvals?select=*&order=requested_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_recommendations?select=*&order=created_at.desc&limit=20", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_operational_controls?select=*&order=updated_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_telemetry?select=*&order=observed_at.desc&limit=300", method: "GET" }),
  ]);
  const facilityControls = filterByFacility(controls, member).map(toOperationalControl).filter((control): control is AtlasOperationalControl => Boolean(control));
  const facilityTelemetry = filterByFacility(telemetry, member).map(toTelemetryReading).filter((reading): reading is AtlasTelemetryReading => Boolean(reading));
  const maintenanceSignals = Array.from(new Set(facilityTelemetry.map((reading) => reading.assetId))).map((assetId) => deriveMaintenanceSignal(facilityTelemetry.filter((reading) => reading.assetId === assetId))).filter((signal): signal is AtlasMaintenanceSignal => signal !== null);
  return {
    status: "ready" as const,
    member,
    permissions: permissionsForRole(member.role),
    assets: filterByFacility(assets, member),
    workItems: filterByFacility(workItems, member),
    events: filterByFacility(events, member),
    approvals: filterByFacility(approvals, member),
    recommendations: filterByFacility(recommendations, member),
    operationalControls: facilityControls,
    telemetry: facilityTelemetry,
    maintenanceSignals,
  };
}

export async function completeOperationalControl(manusUserId: number, controlId: string, evidenceEventIds: string[]) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "control:complete");
  const rows = await supabaseRequest<AtlasRecord[]>({ path: `atlas_operational_controls?id=eq.${encodeURIComponent(controlId)}&select=*&limit=1`, method: "GET" });
  const control = rows[0];
  if (!control) throw new Error("Operational control not found.");
  if (typeof control.facility_id === "string" && member.facilityIds.length > 0 && !member.facilityIds.includes(control.facility_id)) throw new Error("This operational control is outside your facility scope.");
  if (control.required_evidence === true && evidenceEventIds.length === 0) throw new Error("Evidence is required before this operational control can be verified.");
  const priorData = control.data && typeof control.data === "object" ? control.data : {};
  await supabaseRequest({ path: `atlas_operational_controls?id=eq.${encodeURIComponent(controlId)}`, method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "verified", updated_at: new Date().toISOString(), data: { ...priorData, verified_by_member_id: member.id, verified_at: new Date().toISOString(), evidence_event_ids: evidenceEventIds } }) });
  return { controlId, status: "verified" as const };
}

export async function uploadAtlasEvidence(manusUserId: number, draft: Pick<AtlasEvidenceDraft, "id" | "eventClientId" | "contentType" | "filename" | "sizeBytes" | "entityType" | "entityId"> & { facilityId?: string; base64: string }) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "evidence:upload");
  const content = Buffer.from(draft.base64, "base64");
  if (!content.length || content.length > 16 * 1024 * 1024) throw new Error("Evidence must be between 1 byte and 16 MB.");
  if (content.length !== draft.sizeBytes) throw new Error("Evidence size verification failed.");
  if (!new Set(["image/jpeg", "image/png", "image/heic", "audio/m4a", "audio/mp4", "audio/webm"]).has(draft.contentType)) throw new Error("Evidence type is not supported.");
  if (draft.facilityId && member.facilityIds.length > 0 && !member.facilityIds.includes(draft.facilityId)) throw new Error("Evidence cannot be uploaded outside your facility scope.");
  const sanitizedFilename = draft.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stored = await storagePut(`atlas-evidence/${member.id}/${draft.eventClientId}/${sanitizedFilename}`, content, draft.contentType);
  await supabaseRequest({ path: "atlas_evidence", method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ event_client_id: draft.eventClientId, actor_member_id: member.id, facility_id: draft.facilityId ?? null, entity_type: draft.entityType, entity_id: draft.entityId, storage_key: stored.key, storage_url: stored.url, content_type: draft.contentType, filename: sanitizedFilename, size_bytes: content.length }) });
  return { id: draft.id, url: stored.url, key: stored.key };
}

export async function syncAtlasEvents(manusUserId: number, inputs: AtlasEventInput[]) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "event:record");
  if (inputs.length > 50) throw new Error("A sync batch cannot contain more than 50 events.");
  const accepted: string[] = [];
  for (const input of inputs) {
    if (input.eventType === "asset_scanned") requireAtlasPermission(member, "scan:record");
    await supabaseRequest<AtlasRecord[]>({
      path: "atlas_events?on_conflict=client_event_id",
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ client_event_id: input.clientEventId, event_type: input.eventType, entity_type: input.entityType, entity_id: input.entityId, facility_id: input.facilityId ?? null, payload: input.payload, actor_member_id: member.id, source: "mobile", occurred_at: input.occurredAt }),
    });
    accepted.push(input.clientEventId);
  }
  return { accepted, actorId: member.id };
}

function recordsForGrounding(workspace: Awaited<ReturnType<typeof getAtlasWorkspace>>) {
  return {
    assets: workspace.assets.slice(0, 20).map((record) => ({ id: record.id, name: record.name, status: record.status, facility_id: record.facility_id, updated_at: record.updated_at })),
    workItems: workspace.workItems.slice(0, 20).map((record) => ({ id: record.id, title: record.title, status: record.status, priority: record.priority, facility_id: record.facility_id })),
    events: workspace.events.slice(0, 30).map((record) => ({ id: record.id, event_type: record.event_type, entity_type: record.entity_type, entity_id: record.entity_id, occurred_at: record.occurred_at, payload: record.payload })),
    approvals: workspace.approvals.slice(0, 20).map((record) => ({ id: record.id, status: record.status, target_type: record.target_type, target_id: record.target_id, required_role: record.required_role })),
    operationalControls: workspace.operationalControls.slice(0, 20),
    maintenanceSignals: workspace.maintenanceSignals.slice(0, 20),
  };
}

export async function askAtlasIntelligence(manusUserId: number, question: string) {
  const workspace = await getAtlasWorkspace(manusUserId);
  const member = requireAtlasPermission(workspace.member, "intelligence:ask");
  if (workspace.status !== "ready") throw new Error("Atlas live workspace is not ready for intelligence analysis.");
  const catalog = await listLLMModels();
  const model = catalog.data.find((candidate) => candidate.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
  if (!model) throw new Error("No Atlas intelligence model is available.");
  const response = await invokeLLM({
    model,
    messages: [
      { role: "system", content: "You are Atlas Industrial Systems. Analyze only the operational records supplied. Never invent facts, values, record IDs, or causes. Do not claim to execute actions. Cite only provided IDs. If evidence is incomplete, state it. Return JSON with keys situation, evidence, options, tradeoffs, recommendation, confidence, authorizationRole, expectedOutcome, citations. citations must be an array of objects with recordType, recordId, and label." },
      { role: "user", content: JSON.stringify({ question, member: { role: member.role, facilities: member.facilityIds }, records: recordsForGrounding(workspace) }) },
    ],
    response_format: { type: "json_object" },
  });
  const text = response.choices[0]?.message.content;
  if (typeof text !== "string") throw new Error("Atlas intelligence returned no usable analysis.");
  const recommendation = normalizeGroundedRecommendation(JSON.parse(text) as Omit<GroundedRecommendation, "id">, randomUUID());
  await supabaseRequest({ path: "atlas_recommendations", method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: recommendation.id, question, payload: recommendation, status: "awaiting_authorization", required_role: recommendation.authorizationRole, facility_id: member.facilityIds[0] ?? null, requested_by_member_id: member.id }) });
  return recommendation;
}

export async function decideAtlasRecommendation(manusUserId: number, recommendationId: string, decision: "approved" | "rejected", note?: string) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "recommendation:approve");
  const rows = await supabaseRequest<AtlasRecord[]>({ path: `atlas_recommendations?id=eq.${encodeURIComponent(recommendationId)}&select=*&limit=1`, method: "GET" });
  const recommendation = rows[0];
  if (!recommendation) throw new Error("Recommendation not found.");
  if (typeof recommendation.required_role === "string" && atlasRoles.includes(recommendation.required_role as AtlasRole) && !hasAtlasPermission(member.role, "recommendation:approve")) throw new Error("Your role cannot authorize this recommendation.");
  await supabaseRequest({ path: `atlas_recommendations?id=eq.${encodeURIComponent(recommendationId)}`, method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: decision, decided_by_member_id: member.id, decided_at: new Date().toISOString(), decision_note: note ?? null }) });
  await supabaseRequest({ path: "atlas_approvals", method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ recommendation_id: recommendationId, target_type: "recommendation", target_id: recommendationId, status: decision, required_role: recommendation.required_role, requested_by_member_id: recommendation.requested_by_member_id, decided_by_member_id: member.id, decision_note: note ?? null }) });
  return { recommendationId, decision };
}
