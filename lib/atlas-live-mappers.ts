import type { AtlasAsset, AtlasTask, Severity, TaskStatus } from "@/lib/atlas-data";

export type LiveAtlasRecord = Record<string, unknown>;

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mapLiveAsset(record: LiveAtlasRecord): AtlasAsset {
  const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : {};
  const rawStatus = stringValue(record.status, "attention").toLowerCase();
  const status: AtlasAsset["status"] = rawStatus === "operating" ? "Operating" : rawStatus === "stopped" ? "Stopped" : rawStatus === "maintenance" ? "Maintenance" : "Attention";
  const history = Array.isArray(data.history) ? data.history.filter((entry): entry is string => typeof entry === "string") : [];
  return {
    id: stringValue(record.id, "live-asset"),
    name: stringValue(record.name, "Unnamed live asset"),
    type: stringValue(record.asset_type, "Industrial asset"),
    code: stringValue(record.asset_code, "No asset code"),
    status,
    location: stringValue(record.facility_id, "Facility scope pending"),
    custodian: stringValue(data.custodian, "Unassigned"),
    health: numberValue(record.health_score, 0),
    utilization: stringValue(data.utilization, "Live utilization unavailable"),
    alert: stringValue(data.alert, "No active alert recorded."),
    nextAction: stringValue(data.next_action, "Review the asset’s current live state before acting."),
    serial: stringValue(record.serial_number, "No serial number recorded"),
    manufactured: stringValue(data.manufactured, "Lifecycle date unavailable"),
    history: history.length ? history : ["Live passport record retrieved from the authorized workspace."],
  };
}

export function mapLiveWorkItem(record: LiveAtlasRecord): AtlasTask {
  const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : {};
  const rawPriority = stringValue(record.priority, "normal").toLowerCase();
  const severity: Severity = rawPriority === "critical" ? "critical" : rawPriority === "high" ? "high" : rawPriority === "attention" || rawPriority === "medium" ? "attention" : "normal";
  const rawStatus = stringValue(record.status, "ready").toLowerCase();
  const status: TaskStatus = rawStatus === "in progress" || rawStatus === "in_progress" ? "In progress" : rawStatus === "blocked" ? "Blocked" : rawStatus === "completed" ? "Completed" : "Ready";
  return {
    id: stringValue(record.id, "live-work-item"),
    title: stringValue(record.title, "Untitled work item"),
    type: stringValue(record.work_type, "Operational work"),
    location: stringValue(record.facility_id, "Facility scope pending"),
    owner: stringValue(data.owner_name, "Assigned team"),
    due: stringValue(record.due_at, "Due date not set"),
    severity,
    status,
    resources: stringValue(data.resources, "Resources to be confirmed"),
    procedure: stringValue(record.procedure, "Review the live procedure and required controls before starting work."),
    evidence: stringValue(record.evidence_requirement, "Attach verification evidence before completion."),
    relatedAssetId: typeof record.asset_id === "string" ? record.asset_id : undefined,
  };
}
