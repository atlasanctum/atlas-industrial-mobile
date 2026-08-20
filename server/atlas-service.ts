import { randomUUID } from "node:crypto";

import { invokeLLM, listLLMModels } from "./_core/llm";
import { isSupabaseConfigured, supabaseRequest } from "./supabase";
import {
  atlasRoles,
  hasAtlasPermission,
  normalizeGroundedRecommendation,
  permissionsForRole,
  type AtlasEventInput,
  type AtlasMember,
  type AtlasPermission,
  type AtlasRole,
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

export async function getAtlasWorkspace(manusUserId: number) {
  if (!isSupabaseConfigured()) {
    return { status: "not_configured" as const, member: null, permissions: [], assets: [], workItems: [], events: [], approvals: [], recommendations: [] };
  }
  const member = await getAtlasMember(manusUserId);
  if (!member) {
    return { status: "awaiting_role" as const, member: null, permissions: [], assets: [], workItems: [], events: [], approvals: [], recommendations: [] };
  }
  const [assets, workItems, events, approvals, recommendations] = await Promise.all([
    supabaseRequest<AtlasRecord[]>({ path: "atlas_assets?select=*&order=updated_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_work_items?select=*&order=updated_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_events?select=*&order=occurred_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_approvals?select=*&order=requested_at.desc&limit=100", method: "GET" }),
    supabaseRequest<AtlasRecord[]>({ path: "atlas_recommendations?select=*&order=created_at.desc&limit=20", method: "GET" }),
  ]);
  return {
    status: "ready" as const,
    member,
    permissions: permissionsForRole(member.role),
    assets: filterByFacility(assets, member),
    workItems: filterByFacility(workItems, member),
    events: filterByFacility(events, member),
    approvals: filterByFacility(approvals, member),
    recommendations: filterByFacility(recommendations, member),
  };
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
      body: JSON.stringify({
        client_event_id: input.clientEventId,
        event_type: input.eventType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        facility_id: input.facilityId ?? null,
        payload: input.payload,
        actor_member_id: member.id,
        source: "mobile",
        occurred_at: input.occurredAt,
      }),
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
  };
}

export async function askAtlasIntelligence(manusUserId: number, question: string) {
  const workspace = await getAtlasWorkspace(manusUserId);
  const member = requireAtlasPermission(workspace.member, "intelligence:ask");
  if (workspace.status !== "ready") throw new Error("Atlas live workspace is not ready for intelligence analysis.");
  const catalog = await listLLMModels();
  const model = catalog.data.find((candidate) => candidate.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
  if (!model) throw new Error("No Atlas intelligence model is available.");
  const recordContext = recordsForGrounding(workspace);
  const response = await invokeLLM({
    model,
    messages: [
      {
        role: "system",
        content: "You are Atlas Industrial Systems. Analyze only the operational records supplied. Never invent facts, values, record IDs, or causes. Do not claim to execute actions. Cite only provided IDs. If evidence is incomplete, state it. Return JSON with keys situation, evidence, options, tradeoffs, recommendation, confidence, authorizationRole, expectedOutcome, citations. citations must be an array of objects with recordType, recordId, and label.",
      },
      {
        role: "user",
        content: JSON.stringify({ question, member: { role: member.role, facilities: member.facilityIds }, records: recordContext }),
      },
    ],
    response_format: { type: "json_object" },
  });
  const text = response.choices[0]?.message.content;
  if (typeof text !== "string") throw new Error("Atlas intelligence returned no usable analysis.");
  const parsed = JSON.parse(text) as Omit<GroundedRecommendation, "id">;
  const recommendation = normalizeGroundedRecommendation(parsed, randomUUID());
  await supabaseRequest({
    path: "atlas_recommendations",
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: recommendation.id,
      question,
      payload: recommendation,
      status: "awaiting_authorization",
      required_role: recommendation.authorizationRole,
      facility_id: member.facilityIds[0] ?? null,
      requested_by_member_id: member.id,
    }),
  });
  return recommendation;
}

export async function decideAtlasRecommendation(manusUserId: number, recommendationId: string, decision: "approved" | "rejected", note?: string) {
  const member = requireAtlasPermission(await getAtlasMember(manusUserId), "recommendation:approve");
  const rows = await supabaseRequest<AtlasRecord[]>({ path: `atlas_recommendations?id=eq.${encodeURIComponent(recommendationId)}&select=*&limit=1`, method: "GET" });
  const recommendation = rows[0];
  if (!recommendation) throw new Error("Recommendation not found.");
  const requiredRole = recommendation.required_role;
  if (typeof requiredRole === "string" && atlasRoles.includes(requiredRole as AtlasRole) && !hasAtlasPermission(member.role, "recommendation:approve")) {
    throw new Error("Your role cannot authorize this recommendation.");
  }
  await supabaseRequest({
    path: `atlas_recommendations?id=eq.${encodeURIComponent(recommendationId)}`,
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status: decision, decided_by_member_id: member.id, decided_at: new Date().toISOString(), decision_note: note ?? null }),
  });
  await supabaseRequest({
    path: "atlas_approvals",
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ recommendation_id: recommendationId, target_type: "recommendation", target_id: recommendationId, status: decision, required_role: recommendation.required_role, requested_by_member_id: recommendation.requested_by_member_id, decided_by_member_id: member.id, decision_note: note ?? null }),
  });
  return { recommendationId, decision };
}
