import { randomUUID } from "node:crypto";

import { invokeLLM, listLLMModels } from "./_core/llm";
import { storagePut } from "./storage";
import { isSupabaseConfigured, supabaseRequest } from "./supabase";
import {
  atlasTelemetryMetrics,
  atlasRoles,
  deriveMaintenanceSignal,
  hasAtlasPermission,
  isAllowedEvidenceContentType,
  isValidTelemetryReading,
  normalizeGroundedRecommendation,
  permissionsForRole,
  type AtlasEventInput,
  type AtlasEvidenceDraft,
  type AtlasMaintenanceSignal,
  type AtlasMember,
  type AtlasOperationalControl,
  type AtlasCapacityOffer,
  type AtlasMatchObjective,
  type AtlasNetworkDemand,
  type AtlasPermission,
  type AtlasRole,
  type AtlasTelemetryReading,
  type GroundedRecommendation,
  rankNetworkMatches,
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
  if (control.required_evidence === true) {
    const uniqueEvidenceIds = [...new Set(evidenceEventIds)];
    const verifiedEvidence = await Promise.all(uniqueEvidenceIds.map((eventId) => supabaseRequest<AtlasRecord[]>({ path: `atlas_evidence?event_client_id=eq.${encodeURIComponent(eventId)}&select=id,facility_id&limit=1`, method: "GET" })));
    if (verifiedEvidence.some((records) => records.length === 0)) throw new Error("Required evidence has not finished secure upload.");
    if (member.facilityIds.length > 0 && verifiedEvidence.flat().some((record) => typeof record.facility_id === "string" && !member.facilityIds.includes(record.facility_id))) throw new Error("Evidence is outside your facility scope.");
  }
  const priorData = control.data && typeof control.data === "object" ? control.data : {};
  await supabaseRequest({ path: `atlas_operational_controls?id=eq.${encodeURIComponent(controlId)}`, method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "verified", updated_at: new Date().toISOString(), data: { ...priorData, verified_by_member_id: member.id, verified_at: new Date().toISOString(), evidence_event_ids: evidenceEventIds } }) });
  return { controlId, status: "verified" as const };
}

export async function uploadAtlasEvidence(manusUserId: number, draft: Pick<AtlasEvidenceDraft, "id" | "eventClientId" | "contentType" | "filename" | "sizeBytes" | "entityType" | "entityId"> & { facilityId?: string; base64: string }) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "evidence:upload");
  const content = Buffer.from(draft.base64, "base64");
  if (!content.length || content.length > 16 * 1024 * 1024) throw new Error("Evidence must be between 1 byte and 16 MB.");
  if (content.length !== draft.sizeBytes) throw new Error("Evidence size verification failed.");
  if (!isAllowedEvidenceContentType(draft.contentType)) throw new Error("Evidence type is not supported.");
  if (draft.facilityId && member.facilityIds.length > 0 && !member.facilityIds.includes(draft.facilityId)) throw new Error("Evidence cannot be uploaded outside your facility scope.");
  const sanitizedFilename = draft.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stored = await storagePut(`atlas-evidence/${member.id}/${draft.eventClientId}/${sanitizedFilename}`, content, draft.contentType);
  await supabaseRequest({ path: "atlas_evidence?on_conflict=storage_key", method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ event_client_id: draft.eventClientId, actor_member_id: member.id, facility_id: draft.facilityId ?? null, entity_type: draft.entityType, entity_id: draft.entityId, storage_key: stored.key, storage_url: stored.url, content_type: draft.contentType, filename: sanitizedFilename, size_bytes: content.length }) });
  return { id: draft.id, url: stored.url, key: stored.key };
}

export async function syncAtlasEvents(manusUserId: number, inputs: AtlasEventInput[]) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "event:record");
  if (inputs.length > 50) throw new Error("A sync batch cannot contain more than 50 events.");
  const accepted: string[] = [];
  for (const input of inputs) {
    if (input.eventType === "asset_scanned") requireAtlasPermission(member, "scan:record");
    if (input.facilityId && member.facilityIds.length > 0 && !member.facilityIds.includes(input.facilityId)) throw new Error("An event cannot be recorded outside your facility scope.");
    if (Date.parse(input.occurredAt) > Date.now() + 5 * 60 * 1000) throw new Error("An event timestamp cannot be more than five minutes in the future.");
    if (JSON.stringify(input.payload).length > 64 * 1024) throw new Error("An event payload exceeds the 64 KB safety limit.");
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

export async function getAtlasOperatingLayer(manusUserId: number) {
  const workspace = await getAtlasWorkspace(manusUserId);
  const member = requireAtlasPermission(workspace.member, "workspace:view");
  const [relationships, twins, memory, scenarios, policies, agentRuns] = await Promise.all([
    supabaseRequest<AtlasRecord[]>({ path: "atlas_relationships?select=*&order=created_at.desc&limit=200", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_twin_snapshots?select=*&order=observed_at.desc&limit=200", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_memory_entries?select=*&order=occurred_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_scenarios?select=*&order=created_at.desc&limit=50", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_policies?select=*&order=updated_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_agent_runs?select=*&order=created_at.desc&limit=100", method: "GET" }),
  ]);
  return {
    member,
    relationships: filterByFacility(relationships, member),
    twinSnapshots: filterByFacility(twins, member),
    memoryEntries: filterByFacility(memory, member),
    scenarios: filterByFacility(scenarios, member),
    policies: filterByFacility(policies, member),
    agentRuns: filterByFacility(agentRuns, member),
  };
}

export async function createAtlasScenario(manusUserId: number, input: { scopeType: "facility" | "line" | "asset" | "enterprise"; scopeId?: string; premise: string; assumptions: Record<string, unknown> }) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "scenario:simulate");
  const scenarioId = randomUUID();
  await supabaseRequest({
    path: "atlas_scenarios",
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ id: scenarioId, facility_id: member.facilityIds[0] ?? null, requested_by_member_id: member.id, scope_type: input.scopeType, scope_id: input.scopeId ?? null, premise: input.premise, assumptions: input.assumptions, projection: {}, evidence_state: "estimated", required_role: "manager", status: "awaiting_approval" }),
  });
  await supabaseRequest({ path: "atlas_audit_log", method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ facility_id: member.facilityIds[0] ?? null, actor_member_id: member.id, action_type: "scenario_requested", target_type: "scenario", target_id: scenarioId, metadata: { scopeType: input.scopeType, scopeId: input.scopeId ?? null } }) });
  return { scenarioId, status: "awaiting_approval" as const, requiredRole: "manager" as const };
}

export async function decideAtlasScenario(manusUserId: number, scenarioId: string, decision: "approved" | "rejected", note?: string) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "recommendation:approve");
  const rows = await supabaseRequest<AtlasRecord[]>({ path: `atlas_scenarios?id=eq.${encodeURIComponent(scenarioId)}&select=*&limit=1`, method: "GET" });
  const scenario = rows[0];
  if (!scenario) throw new Error("Scenario not found.");
  if (typeof scenario.facility_id === "string" && member.facilityIds.length > 0 && !member.facilityIds.includes(scenario.facility_id)) throw new Error("This scenario is outside your facility scope.");
  if (scenario.required_role === "executive" && member.role !== "executive") throw new Error("Executive authorization is required for this scenario.");
  await supabaseRequest({ path: `atlas_scenarios?id=eq.${encodeURIComponent(scenarioId)}`, method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: decision, updated_at: new Date().toISOString() }) });
  await supabaseRequest({ path: "atlas_audit_log", method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ facility_id: scenario.facility_id ?? null, actor_member_id: member.id, action_type: `scenario_${decision}`, target_type: "scenario", target_id: scenarioId, metadata: { note: note ?? null } }) });
  return { scenarioId, decision };
}

function networkRecordVisible(record: AtlasRecord, member: AtlasMember) {
  if (record.owner_member_id === member.id) return true;
  if (record.visibility === "public") return true;
  const allowlist = Array.isArray(record.allowed_member_ids) ? record.allowed_member_ids : [];
  return allowlist.includes(member.id);
}

function toNetworkOffer(record: AtlasRecord): AtlasCapacityOffer | null {
  const visibility = record.visibility;
  if (typeof record.id !== "string" || typeof record.organization_id !== "string" || typeof record.capability !== "string" || typeof record.available_hours !== "number" || typeof record.lead_time_days !== "number" || typeof record.cost_index !== "number" || typeof record.quality_score !== "number" || typeof record.reliability_score !== "number" || typeof record.resilience_score !== "number" || typeof record.impact_score !== "number" || (visibility !== "private" && visibility !== "partner" && visibility !== "consortium" && visibility !== "public")) return null;
  return { id: record.id, participantId: record.organization_id, capability: record.capability, availableHours: record.available_hours, earliestStart: typeof record.earliest_start === "string" ? record.earliest_start : "Availability pending", leadTimeDays: record.lead_time_days, costIndex: record.cost_index, qualityScore: record.quality_score, reliabilityScore: record.reliability_score, resilienceScore: record.resilience_score, impactScore: record.impact_score, certifications: Array.isArray(record.certifications) ? record.certifications.filter((value): value is string => typeof value === "string") : [], visibility };
}

function toNetworkDemand(record: AtlasRecord): AtlasNetworkDemand | null {
  if (typeof record.id !== "string" || typeof record.title !== "string" || typeof record.required_capability !== "string" || typeof record.required_hours !== "number") return null;
  const dueAt = typeof record.due_at === "string" ? Date.parse(record.due_at) : NaN;
  const dueInDays = Number.isFinite(dueAt) ? Math.max(1, Math.ceil((dueAt - Date.now()) / 86_400_000)) : 30;
  return { id: record.id, title: record.title, requiredCapability: record.required_capability, requiredHours: record.required_hours, dueInDays, minimumQuality: typeof record.minimum_quality === "number" ? record.minimum_quality : 0, requiredCertification: typeof record.required_certification === "string" ? record.required_certification : undefined, region: typeof record.region === "string" ? record.region : "Unspecified" };
}

export async function getAtlasNetwork(manusUserId: number) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "network:view");
  const [organizations, offers, demands, matches, transactions, certificates] = await Promise.all([
    supabaseRequest<AtlasRecord[]>({ path: "atlas_network_organizations?select=*&order=display_name.asc&limit=200", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_network_capacity_offers?active=eq.true&select=*&order=updated_at.desc&limit=200", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_network_demands?select=*&order=created_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_network_matches?select=*&order=created_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_network_transactions?select=*&order=updated_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_network_certificates?select=*&order=created_at.desc&limit=200", method: "GET" }),
  ]);
  const visibleOffers = offers.filter((record) => networkRecordVisible(record, member));
  const visibleDemandIds = new Set(demands.filter((record) => networkRecordVisible(record, member)).map((record) => record.id));
  return { member, organizations, offers: visibleOffers, demands: demands.filter((record) => visibleDemandIds.has(record.id)), matches: matches.filter((record) => visibleDemandIds.has(record.demand_id)), transactions, certificates };
}

export async function requestAtlasNetworkMatch(manusUserId: number, input: { demandId: string; offerId: string; objective: AtlasMatchObjective }) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "network:request");
  const [demandRows, offerRows] = await Promise.all([
    supabaseRequest<AtlasRecord[]>({ path: `atlas_network_demands?id=eq.${encodeURIComponent(input.demandId)}&select=*&limit=1`, method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: `atlas_network_capacity_offers?id=eq.${encodeURIComponent(input.offerId)}&active=eq.true&select=*&limit=1`, method: "GET" }),
  ]);
  const demandRecord = demandRows[0];
  const offerRecord = offerRows[0];
  if (!demandRecord || !offerRecord) throw new Error("Network demand or capacity offer was not found.");
  if (!networkRecordVisible(demandRecord, member) || !networkRecordVisible(offerRecord, member)) throw new Error("This network record is not visible to your role and sharing scope.");
  const demand = toNetworkDemand(demandRecord);
  const offer = toNetworkOffer(offerRecord);
  if (!demand || !offer) throw new Error("Network record has an invalid matching shape.");
  const score = rankNetworkMatches(demand, [offer], input.objective)[0];
  if (!score) throw new Error("The selected capacity does not satisfy the current demand constraints.");
  const matchId = randomUUID();
  await supabaseRequest({ path: "atlas_network_matches", method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: matchId, demand_id: demand.id, offer_id: offer.id, requested_by_member_id: member.id, objective: input.objective, score: score.score, explanation: score.explanation, evidence_state: score.evidenceState, status: "awaiting_approval" }) });
  await supabaseRequest({ path: "atlas_network_audit_log", method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_member_id: member.id, action_type: "network_match_requested", target_type: "network_match", target_id: matchId, data_visibility: offer.visibility, provenance: { demandId: demand.id, offerId: offer.id, objective: input.objective } }) });
  return { matchId, status: "awaiting_approval" as const, score: score.score };
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
