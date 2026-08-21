import type { AtlasAgentFinding, AtlasApprovalPolicy, AtlasCausalLink, AtlasDigitalTwin, AtlasHealthDimension, AtlasMemoryEntry, AtlasScenario } from "@/shared/atlas-domain";
import { weightedIndustrialHealth } from "@/shared/atlas-domain";

export const healthDimensions: AtlasHealthDimension[] = [
  { id: "production", label: "Production", value: 87, state: "watch", evidenceState: "verified", explanation: "Machine 14 capacity constraint is constraining the morning plan." },
  { id: "capacity", label: "Capacity", value: 79, state: "watch", evidenceState: "verified", explanation: "Line 2 has limited recovery headroom during Shift A." },
  { id: "inventory", label: "Inventory", value: 92, state: "normal", evidenceState: "verified", explanation: "Critical material coverage is above the active reorder point." },
  { id: "logistics", label: "Logistics", value: 83, state: "watch", evidenceState: "likely", explanation: "Express replacement-part availability is awaiting carrier confirmation." },
  { id: "quality", label: "Quality", value: 96, state: "normal", evidenceState: "verified", explanation: "Current inspection results are within the approved control band." },
  { id: "safety", label: "Safety", value: 99, state: "normal", evidenceState: "verified", explanation: "No unverified safety controls are outstanding." },
  { id: "finance", label: "Finance", value: 76, state: "watch", evidenceState: "estimated", explanation: "Expedite cost remains within the approved recovery budget." },
  { id: "projects", label: "Projects", value: 61, state: "at_risk", evidenceState: "likely", explanation: "Project Horizon delivery depends on recovery of Line 2." },
  { id: "resilience", label: "Resilience", value: 68, state: "at_risk", evidenceState: "estimated", explanation: "One alternate machine can absorb only part of the affected load." },
];

export const enterpriseHealth = weightedIndustrialHealth(healthDimensions);

export const digitalTwins: AtlasDigitalTwin[] = [
  {
    assetId: "MX-14",
    title: "Machine 14",
    facility: "North Plant",
    line: "Line 2 · Precision Assembly",
    currentState: "Running at 72% utilization with an elevated vibration reading.",
    historicalState: "Average utilization 81%; two maintenance calls in the last 30 days.",
    expectedState: "Scheduled load rises to 87% during the next production release.",
    predictedState: "Bearing degradation risk is increasing if vibration remains above the watch threshold.",
    recommendation: "Inspect bearing condition before the next production release and prepare Machine 8 as an approved fallback.",
    evidenceState: "likely",
    linkedEventIds: ["EV-4812", "WO-182"],
  },
  {
    assetId: "LINE-2",
    title: "Line 2",
    facility: "North Plant",
    line: "Precision Assembly",
    currentState: "Throughput is below plan due to Machine 14 constrained duty.",
    historicalState: "Cycle time has remained within band until the current maintenance pattern.",
    expectedState: "Planned order release requires 87% of designed capacity.",
    predictedState: "Delivery exposure grows if the asset constraint persists beyond the current shift.",
    recommendation: "Review the recovery scenario with operations, asset, and logistics leads before dispatch cut-off.",
    evidenceState: "estimated",
    linkedEventIds: ["EV-4812", "SO-812"],
  },
];

export const causalLinks: AtlasCausalLink[] = [
  {
    id: "cause-line2-delay",
    observation: "Line 2 output is below the scheduled production rate.",
    contributor: "Machine 14 is operating at constrained duty after elevated vibration readings.",
    cause: "Maintenance history suggests bearing degradation as the probable root cause.",
    verification: "Inspection is required to confirm wear before Atlas can label the cause verified.",
    evidenceState: "likely",
    citations: [{ recordType: "telemetry", recordId: "MX-14-vibration", label: "Machine 14 vibration reading" }, { recordType: "work_item", recordId: "WO-182", label: "Recovery work order" }],
  },
];

export const industrialMemory: AtlasMemoryEntry[] = [
  {
    id: "MEM-14-01",
    timestamp: "Today · 08:42",
    event: "Machine 14 vibration crossed the watch band during Shift A.",
    decision: "Operations deferred the production release pending asset inspection.",
    outcome: "Recovery work order WO-182 was created and the delivery risk was surfaced.",
    lesson: "Inspect bearing condition before accepting an above-watch vibration trend into a high-load cycle.",
    owner: "Amina Yusuf · Operations",
    evidenceState: "verified",
    linkedAssetId: "MX-14",
    linkedEventIds: ["EV-4812", "WO-182"],
  },
  {
    id: "MEM-08-09",
    timestamp: "9 Aug · 14:10",
    event: "A prior line constraint reduced available capacity during a delivery-critical window.",
    decision: "Manager approved use of an alternate production cell and expedited component supply.",
    outcome: "The highest-priority customer commitment was protected; overtime cost increased.",
    lesson: "Use alternate capacity only with a linked delivery and margin assessment.",
    owner: "Javier Chen · Plant Manager",
    evidenceState: "verified",
    linkedAssetId: "LINE-2",
    linkedEventIds: ["EV-4671", "SO-778"],
  },
];

export const scenarioLibrary: AtlasScenario[] = [
  {
    id: "SCN-M14-24H",
    title: "Machine 14 offline for 24 hours",
    premise: "Machine 14 remains unavailable through the next planned production cycle.",
    scope: "asset",
    expectedProduction: "−7.4%",
    deliveryImpact: "+11 hours",
    marginImpact: "−3.2%",
    riskState: "at_risk",
    recommendation: "Move Job 182 to Machine 8, protect Order SO-812, and request expedited bearing supply.",
    evidenceState: "estimated",
    requiredRole: "manager",
  },
  {
    id: "SCN-ALT-SHIFT",
    title: "Add a second production shift",
    premise: "Add a supervised second shift for the recovery window after verified maintenance release.",
    scope: "line",
    expectedProduction: "+9.1%",
    deliveryImpact: "Recovery within current day",
    marginImpact: "−1.1% overtime",
    riskState: "watch",
    recommendation: "Approve only if safety staffing and quality inspection coverage are confirmed.",
    evidenceState: "estimated",
    requiredRole: "manager",
  },
  {
    id: "SCN-SUPPLIER-A",
    title: "Supplier A cannot deliver",
    premise: "The replacement bearing shipment misses the planned arrival window.",
    scope: "facility",
    expectedProduction: "−4.8%",
    deliveryImpact: "+7 hours",
    marginImpact: "−1.6% expedite alternative",
    riskState: "at_risk",
    recommendation: "Qualify alternate supply only after quality and procurement review of total landed cost.",
    evidenceState: "likely",
    requiredRole: "manager",
  },
];

export const agentFindings: AtlasAgentFinding[] = [
  { agent: "operations", title: "Capacity constraint", finding: "Line 2 has limited recovery headroom while Machine 14 remains constrained.", evidenceState: "verified", riskState: "at_risk", linkedRecordIds: ["LINE-2", "WO-182"] },
  { agent: "asset", title: "Maintenance signal", finding: "The strongest equipment contributor is an elevated vibration trend on Machine 14.", evidenceState: "likely", riskState: "at_risk", linkedRecordIds: ["MX-14", "EV-4812"] },
  { agent: "supply", title: "Parts exposure", finding: "Replacement bearing availability is not yet verified for the recovery window.", evidenceState: "likely", riskState: "watch", linkedRecordIds: ["PO-441", "SUP-04"] },
  { agent: "logistics", title: "Delivery risk", finding: "Order SO-812 requires a recovery decision before dispatch cut-off.", evidenceState: "verified", riskState: "at_risk", linkedRecordIds: ["SO-812"] },
  { agent: "finance", title: "Recovery economics", finding: "An approved expedite remains economically preferable to an unmitigated delivery miss.", evidenceState: "estimated", riskState: "watch", linkedRecordIds: ["SO-812", "PO-441"] },
];

export const approvalPolicies: AtlasApprovalPolicy[] = [
  { id: "POL-LOW", title: "Low-impact replenishment", risk: "low", requiredRoles: [], autoExecute: true, description: "Auto-create a recommendation inside the approved inventory value and supplier policy band." },
  { id: "POL-MED", title: "Recovery work reallocation", risk: "medium", requiredRoles: ["manager"], autoExecute: false, description: "A supervisor review and manager authorization are required before reassigning constrained production work." },
  { id: "POL-HIGH", title: "Supplier expedite commitment", risk: "high", requiredRoles: ["manager", "executive"], autoExecute: false, description: "Procurement evidence, financial impact, and manager authorization are required for expedited supply commitments." },
  { id: "POL-CRIT", title: "Safety-critical return to service", risk: "critical", requiredRoles: ["manager", "executive"], autoExecute: false, description: "Multi-party approval and verified inspection evidence are required before return to service." },
];

export const roleBriefs = {
  operator: "Complete safety-critical work first. Machine 14 inspection is the shift’s highest operational priority.",
  manager: "Line 2 recovery must be decided before dispatch cut-off; review capacity, parts, delivery, and margin together.",
  executive: "Enterprise health is watch-state: Project Horizon and the SO-812 commitment carry the highest combined exposure.",
};
