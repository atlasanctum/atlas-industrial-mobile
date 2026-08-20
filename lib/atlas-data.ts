export type Severity = "critical" | "high" | "attention" | "normal" | "good";
export type TaskStatus = "Ready" | "In progress" | "Blocked" | "Completed";

export type AtlasTask = {
  id: string;
  title: string;
  type: string;
  location: string;
  owner: string;
  due: string;
  severity: Severity;
  status: TaskStatus;
  resources: string;
  procedure: string;
  evidence: string;
  relatedAssetId?: string;
  relatedProjectId?: string;
};

export type AtlasAsset = {
  id: string;
  name: string;
  type: string;
  code: string;
  status: "Operating" | "Attention" | "Stopped" | "Maintenance";
  location: string;
  custodian: string;
  health: number;
  utilization: string;
  alert: string;
  nextAction: string;
  serial: string;
  manufactured: string;
  history: string[];
  passport: {
    origin: string;
    materialBatch: string;
    production: string;
    inspection: string;
    logistics: string;
    economics: string;
    impact: string;
  };
};

export type AtlasInventoryItem = {
  id: string;
  name: string;
  location: string;
  state: "Available" | "Reserved" | "Inspection hold" | "Stockout risk";
  detail: string;
  severity: Severity;
};

export type AtlasControl = {
  id: string;
  title: string;
  context: string;
  detail: string;
  status: "Ready" | "Attention" | "Blocked" | "Verified";
  severity: Severity;
};

export type AtlasProject = {
  id: string;
  name: string;
  stage: string;
  location: string;
  completion: number;
  schedule: "On track" | "At risk" | "Delayed";
  budget: string;
  risk: string;
  nextMilestone: string;
  update: string;
};

export type AtlasOrder = {
  id: string;
  customer: string;
  product: string;
  value: string;
  status: "At risk" | "In production" | "Ready to dispatch" | "Awaiting payment";
  note: string;
};

export const initialTasks: AtlasTask[] = [
  {
    id: "WO-182",
    title: "Recover Line 2 production constraint",
    type: "Work order",
    location: "North Plant · Line 2",
    owner: "Amina Yusuf",
    due: "Due in 42 min",
    severity: "critical",
    status: "In progress",
    resources: "Machine 8 · Setup crew · Tooling kit B",
    procedure: "Verify the fault isolation, approve the alternate routing, and confirm the first-off part before releasing the backlog.",
    evidence: "Machine alarm trace and first-off inspection are required.",
    relatedAssetId: "MX-14",
    relatedProjectId: "LH-01",
  },
  {
    id: "IN-044",
    title: "Inspect incoming steel batch KE-2047",
    type: "Quality inspection",
    location: "East Warehouse · Bay 04",
    owner: "You",
    due: "Due this shift",
    severity: "attention",
    status: "Ready",
    resources: "Caliper · Mill certificate · Incoming QA checklist",
    procedure: "Check material identification, dimensions, certificate references, and visual condition before accepting the batch.",
    evidence: "Record 3 measurements and attach a batch photo.",
  },
  {
    id: "MT-091",
    title: "Inspect cooling loop on Machine 14",
    type: "Preventive maintenance",
    location: "North Plant · Line 2",
    owner: "Diego Martins",
    due: "Today · 15:00",
    severity: "high",
    status: "Ready",
    resources: "Thermal camera · PPE · Cooling service kit",
    procedure: "Inspect coolant flow, hose condition and return temperature. Escalate abnormal readings before restart.",
    evidence: "Capture thermal image and technician sign-off.",
    relatedAssetId: "MX-14",
  },
  {
    id: "PR-027",
    title: "Approve LifeHouse site delivery release",
    type: "Approval",
    location: "LifeHouse · Site West",
    owner: "Nora Karim",
    due: "Tomorrow · 09:00",
    severity: "normal",
    status: "Blocked",
    resources: "Delivery note · Installation readiness check",
    procedure: "Confirm site readiness and quality release before allowing dispatch to proceed.",
    evidence: "Approval record and signed dispatch release.",
    relatedProjectId: "LH-01",
  },
];

export const assets: AtlasAsset[] = [
  {
    id: "MX-14",
    name: "Machine 14",
    type: "CNC forming cell",
    code: "AT-PL-014",
    status: "Attention",
    location: "North Plant · Line 2",
    custodian: "Diego Martins",
    health: 71,
    utilization: "83% this shift",
    alert: "Cooling return temperature is outside its normal operating band.",
    nextAction: "Inspect cooling loop before the next production release.",
    serial: "CNC-14-23-0918",
    manufactured: "Installed 12 Sep 2023",
    history: ["Alarm recorded at 08:42", "Job 182 rerouted for recovery", "Last service completed 18 Jul 2026"],
    passport: { origin: "North Plant commissioning record", materialBatch: "Cooling assembly batch CL-14-09", production: "CNC forming cell · Line 2", inspection: "Cooling-loop inspection due", logistics: "Fixed production location", economics: "Downtime is linked to Job 182 recovery and Order SO-812 exposure", impact: "Condition-driven service protects asset life and avoids unplanned scrap." },
  },
  {
    id: "LP-0831",
    name: "LifePod LP-0831",
    type: "Modular housing system",
    code: "LH-PROD-0831",
    status: "Operating",
    location: "LifeHouse · Site West",
    custodian: "Nora Karim",
    health: 96,
    utilization: "Installation ready",
    alert: "Quality release is pending the final delivery approval.",
    nextAction: "Approve site delivery release after installation readiness check.",
    serial: "LP-0831-KE2047",
    manufactured: "Produced 18 Aug 2026",
    history: ["Final inspection passed", "Dispatch pack assembled", "Site acceptance inspection scheduled"],
    passport: { origin: "Kestrel Metals · steel batch KE-2047", materialBatch: "KE-2047", production: "LifeHouse fabrication and final assembly", inspection: "Final inspection passed; delivery release pending", logistics: "North Plant → LifeHouse Site West", economics: "Commercial release is connected to SO-812 and delivery acceptance", impact: "Passport retains material lineage, repairability, and recovery context." },
  },
  {
    id: "VH-08",
    name: "Vehicle 08",
    type: "Flatbed delivery vehicle",
    code: "LOG-VH-08",
    status: "Operating",
    location: "North Plant · Dispatch",
    custodian: "Kofi Adeyemi",
    health: 89,
    utilization: "Available at 14:30",
    alert: "Route plan is dependent on LifeHouse delivery release.",
    nextAction: "Assign route once the delivery release is authorized.",
    serial: "V08-FLT-2024",
    manufactured: "Commissioned 05 Jan 2024",
    history: ["Pre-trip inspection complete", "Route pack prepared", "Fuel level verified"],
    passport: { origin: "Atlas logistics fleet record", materialBatch: "Fleet asset V08", production: "Configured for LifeHouse dispatch", inspection: "Pre-trip inspection complete", logistics: "North Plant dispatch lane", economics: "Route activation follows delivery-release authorization", impact: "Route and fuel checks support lower avoidable travel and failed delivery risk." },
  },
];

export const projects: AtlasProject[] = [
  {
    id: "LH-01",
    name: "LifeHouse Site West",
    stage: "Assembly & commissioning",
    location: "West District",
    completion: 68,
    schedule: "At risk",
    budget: "Within approved range",
    risk: "Line 2 capacity constraint may move the delivery release.",
    nextMilestone: "Delivery release · tomorrow 09:00",
    update: "Protect the delivery release by completing the alternate production route and final site check.",
  },
  {
    id: "MX-02",
    name: "North Plant Modernization",
    stage: "Equipment commissioning",
    location: "North Plant",
    completion: 42,
    schedule: "On track",
    budget: "Within approved range",
    risk: "No active critical constraints.",
    nextMilestone: "Automation cell acceptance · Friday",
    update: "Three commissioning packages are ready for review.",
  },
  {
    id: "WH-04",
    name: "East Warehouse Deployment",
    stage: "Inventory migration",
    location: "East Warehouse",
    completion: 81,
    schedule: "On track",
    budget: "Procurement variance under review",
    risk: "Steel batch KE-2047 remains pending incoming inspection.",
    nextMilestone: "Warehouse handover · next week",
    update: "Complete incoming material verification to close the final receiving constraint.",
  },
];

export const orders: AtlasOrder[] = [
  {
    id: "SO-812",
    customer: "Horizon Communities",
    product: "LifeHouse system package",
    value: "Delivery commitment under review",
    status: "At risk",
    note: "Linked to Line 2 capacity recovery and the LifeHouse delivery release.",
  },
  {
    id: "PO-440",
    customer: "Kestrel Metals",
    product: "Steel batch KE-2047",
    value: "Receiving verification pending",
    status: "In production",
    note: "Material cannot be released to production until incoming inspection is verified.",
  },
  {
    id: "SO-806",
    customer: "Cedar Works",
    product: "Fabricated frame kit",
    value: "Dispatch approved",
    status: "Ready to dispatch",
    note: "Vehicle 08 is available after 14:30 for the assigned route.",
  },
];

export const inventoryItems: AtlasInventoryItem[] = [
  { id: "MAT-KE2047", name: "Steel batch KE-2047", location: "East Warehouse · Bay 04", state: "Inspection hold", detail: "Incoming QA verification is required before production release.", severity: "attention" },
  { id: "CMP-BE14", name: "Bearing assembly kit", location: "North Plant · Maintenance cage", state: "Reserved", detail: "Held against Machine 14 contingency work.", severity: "normal" },
  { id: "POD-0831", name: "LifePod LP-0831", location: "North Plant · Dispatch", state: "Available", detail: "Final delivery release remains pending.", severity: "normal" },
  { id: "SKU-FRM92", name: "Frame connector set", location: "North Plant · Line 2", state: "Stockout risk", detail: "Alternate routing will consume the remaining controlled quantity.", severity: "high" },
];

export const productionPulse = {
  line: "North Plant · Line 2",
  plan: "Recovery plan active",
  throughput: "Protected by controlled alternate routing",
  bottleneck: "Machine 14 cooling return temperature",
  quality: "First-off inspection required before backlog release",
};

export const qualityControls: AtlasControl[] = [
  { id: "QA-044", title: "Incoming steel batch KE-2047", context: "East Warehouse · Bay 04", detail: "Measure, validate mill certificate, then accept or reject the batch.", status: "Attention", severity: "attention" },
  { id: "QA-182", title: "First-off inspection · Job 182", context: "North Plant · Machine 8", detail: "Required before the alternate production route can release backlog.", status: "Ready", severity: "normal" },
];

export const safetyControls: AtlasControl[] = [
  { id: "SAFE-14", title: "Cooling-loop maintenance controls", context: "Machine 14 · Line 2", detail: "PPE, isolation, and thermal verification are required before inspection.", status: "Attention", severity: "high" },
  { id: "SAFE-V08", title: "Pre-trip dispatch check", context: "Vehicle 08 · Dispatch", detail: "Verified route pack, vehicle condition, and driver readiness are recorded.", status: "Verified", severity: "normal" },
];

export const supplierCommitments = [
  { id: "SUP-KE", name: "Kestrel Metals", commitment: "Steel batch KE-2047", status: "Verification pending", detail: "Certificate and dimensional inspection govern release to production.", severity: "attention" as Severity },
  { id: "SUP-NM", name: "Northline Motors", commitment: "Cooling service-kit replenishment", status: "Confirmed", detail: "Contingency kit is reserved for Machine 14 service work.", severity: "normal" as Severity },
];

export const commandBrief = {
  greeting: "Tuesday · 20 August",
  facility: "North Plant",
  health: "Stable with exceptions",
  velocity: "26 min",
  velocityDetail: "Signal → authorized action",
  recommendation: "Move Job 182 to Machine 8 after cooling inspection. This protects Order SO-812 while Machine 14 is assessed.",
};
