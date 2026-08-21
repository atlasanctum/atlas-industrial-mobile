import { rankNetworkMatches, type AtlasCapacityOffer, type AtlasNetworkDemand, type AtlasNetworkParticipant, type AtlasNetworkTransaction, type AtlasResilienceSignal } from "@/shared/atlas-domain";

export const networkParticipants: AtlasNetworkParticipant[] = [
  { id: "NET-ORBIT", name: "Orbit Precision Works", kind: "manufacturer", region: "Nairobi, Kenya", trustState: "verified", deliveryReliability: 96, qualityScore: 94, visibility: "partner" },
  { id: "NET-KIFARU", name: "Kifaru Fabrication", kind: "manufacturer", region: "Thika, Kenya", trustState: "verified", deliveryReliability: 92, qualityScore: 91, visibility: "consortium" },
  { id: "NET-SAFARI", name: "Safari Freight Network", kind: "logistics", region: "Nairobi, Kenya", trustState: "provisional", deliveryReliability: 88, qualityScore: 90, visibility: "partner" },
  { id: "NET-STEEL", name: "Eastline Steel Supply", kind: "supplier", region: "Athi River, Kenya", trustState: "verified", deliveryReliability: 95, qualityScore: 97, visibility: "partner" },
];

export const capacityOffers: AtlasCapacityOffer[] = [
  { id: "CAP-ORBIT-CNC", participantId: "NET-ORBIT", capability: "CNC Machining", availableHours: 43, earliestStart: "Tomorrow", leadTimeDays: 4, costIndex: 62, qualityScore: 94, reliabilityScore: 96, resilienceScore: 88, impactScore: 82, certifications: ["ISO 9001"], visibility: "partner" },
  { id: "CAP-KIFARU-CNC", participantId: "NET-KIFARU", capability: "CNC Machining", availableHours: 58, earliestStart: "Tomorrow", leadTimeDays: 6, costIndex: 48, qualityScore: 91, reliabilityScore: 92, resilienceScore: 91, impactScore: 85, certifications: ["ISO 9001"], visibility: "consortium" },
  { id: "CAP-KIFARU-WELD", participantId: "NET-KIFARU", capability: "Welding", availableHours: 128, earliestStart: "Today", leadTimeDays: 2, costIndex: 55, qualityScore: 92, reliabilityScore: 92, resilienceScore: 91, impactScore: 84, certifications: ["ISO 3834"], visibility: "consortium" },
  { id: "CAP-ORBIT-COAT", participantId: "NET-ORBIT", capability: "Powder Coating", availableHours: 19, earliestStart: "In 3 days", leadTimeDays: 5, costIndex: 58, qualityScore: 95, reliabilityScore: 96, resilienceScore: 86, impactScore: 89, certifications: ["ISO 9001"], visibility: "partner" },
];

export const activeNetworkDemand: AtlasNetworkDemand = { id: "DEM-812", title: "2,000 precision steel brackets", requiredCapability: "CNC Machining", requiredHours: 36, dueInDays: 12, minimumQuality: 90, requiredCertification: "ISO 9001", region: "Nairobi, Kenya" };

export const activeNetworkTransaction: AtlasNetworkTransaction = { id: "TXN-812", title: "SO-812 recovery path", stage: "authorization", evidenceState: "likely", authorizationRequired: true, partnerIds: ["NET-ORBIT", "NET-STEEL", "NET-SAFARI"] };

export const resilienceSignals: AtlasResilienceSignal[] = [
  { title: "Machine 14 dependency", dependency: "North Plant Line 2", state: "at_risk", recoveryTime: "4–8 hours", recoveryCost: "Expedite + alternate setup", alternativePath: "Orbit CNC capacity with verified ISO 9001 evidence", evidenceState: "likely" },
  { title: "Bearing supply exposure", dependency: "Eastline Steel Supply", state: "watch", recoveryTime: "1 day", recoveryCost: "Alternative freight premium", alternativePath: "Partner-visible inventory and Safari Freight return trip", evidenceState: "estimated" },
];

export function networkMatches(objective: Parameters<typeof rankNetworkMatches>[2]) { return rankNetworkMatches(activeNetworkDemand, capacityOffers, objective); }
