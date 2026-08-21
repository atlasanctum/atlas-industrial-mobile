# Atlas Industrial Network

## Purpose

The Atlas Industrial Network extends the facility operating system with a governed coordination layer. Its practical loop is **demand → visible capability → ranked options → authorization → operational proof → learning**. It does not expose raw operating data by default, make binding commercial commitments, process payment, or make lending, underwriting, or legal decisions.

## Network data boundaries

| Layer | Shareable information | Restricted information | Enforcement point |
|---|---|---|---|
| **Private** | Nothing outside the owner organization. | Machine telemetry, internal margins, personnel detail, restricted work. | Service visibility check and allowed-member list. |
| **Partner** | Approved capacity and trust claims for named partners. | Raw source records and unapproved commercial detail. | Explicit allow-list. |
| **Consortium** | Approved offers and aggregated collaboration context. | Member-private data and unrelated demand. | Consortium scope and policy. |
| **Public** | A curated industrial profile only. | Capacity, price, performance, and operating evidence unless independently approved. | Published profile controls. |

## Implemented core

The current mobile and server architecture supports a network exchange with industrial organization profiles, certificates, capacity offers, demand records, objective-based matching, transaction readiness, policies, and audit records. The matcher evaluates only capacity that meets the demand’s capability, time, quality, certification, and visibility constraints. It then ranks eligible options by the selected objective. A requested match is stored as **awaiting approval** and creates an audit event; it does not execute a commercial action.

## Trust and transaction readiness

Partner trust is evidence-aware. It is represented through verified or provisional organizational status, certificate records, delivery reliability, quality scores, and controlled operational provenance rather than open public ratings. The transaction path retains the expected digital thread—demand, offer, authorization, production, inspection, shipment, delivery, invoice, and settlement—while explicitly leaving regulated settlement, financing, insurance, and legal mechanisms outside the present implementation.

## Production rollout

1. Apply `supabase/atlas_schema.sql`, then `supabase/atlas_network_schema.sql`, using the target project’s approved database-change process.
2. Create a small partner cohort and set visibility to the narrowest appropriate level. Begin with one facility, one demand, and two approved capacity offers.
3. Verify the matching result against the source offers and require manager authorization before initiating any external request.
4. Record every authorized outcome through the existing event, evidence, transaction, and memory paths. Expand to consortium sharing only after the privacy and audit evidence is reviewed.

## Future extensions

The schema prepares future work on network resilience, shared logistics, regional benchmarking, skills exchange, and ecosystem simulation. Those layers should reuse the same stable entity IDs, provenance, evidence states, privacy controls, policy gates, and audit contracts rather than bypassing the operating model.
