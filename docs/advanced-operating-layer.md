# Atlas Advanced Industrial Intelligence & Operating Layer

## Purpose

The advanced Atlas layer turns the operational mobile workspace into a closed-loop industrial system. It does not replace the core event fabric, role model, evidence queue, or existing work flows. Instead, it connects these foundations through the following loop:

> **Reality → event → context → interpretation → decision → authorization → workflow → verification → memory → improved reality**

## Implemented architectural surfaces

| Surface | Atlas implementation | Evidence and governance boundary |
|---|---|---|
| **Control tower** | Progressive Enterprise → Facility → Line → Asset drill-down, health dimensions, and linked digital twins. | Composite health never hides its underlying dimensions or their evidence states. |
| **Digital twin** | Current, historical, expected, and predicted states for industrial assets and lines. | Predicted state is explicitly labeled and carries a cited causal path. |
| **Industrial memory** | Event, decision, outcome, lesson, owner, and linked operational records. | Learning records preserve whether the conclusion is verified, likely, estimated, or unknown. |
| **Scenario engine** | Explicit premises, production/delivery/margin impacts, and recommendations. | Scenarios are estimates until live authorization, execution, and outcome verification occur. |
| **Multi-agent coordination** | Operations, asset, supply, logistics, finance, quality, safety, project, and executive agent roles over shared context. | No specialist finding can independently execute an action; the combined recommendation follows the approval policy. |
| **Governance center** | Risk-tiered policies, authority paths, auto-execution bounds, and audit expectations. | Critical actions require configured human authorization and verified evidence. |

## Server-side model

`atlas_schema.sql` now includes tables for industrial relationships, twin snapshots, memory, scenarios, policies, agent runs, and audit records. Server-side routes expose a role- and facility-scoped operating layer and a scenario request procedure. The schema has not been applied to the production Supabase project yet; do not call these endpoints live until the reviewed migration is deployed.

## Guardrails

Atlas separates **facts**, **likely causes**, **estimates**, and **unknowns**. The shared domain model prevents ambiguous evidence labels. Scenarios and agent findings can suggest a path, but the configured policy governs whether the output is auto-executable, requires manager approval, or requires multi-party authorization. The existing event-before-evidence sync order remains the transport invariant for any physical-world action captured offline.

## Production sequence

1. Apply the complete `supabase/atlas_schema.sql` migration in the target Supabase project.
2. Create role-scoped facilities, assets, policies, and approved event sources.
3. Ingest a controlled telemetry reading and verify the resulting asset signal and twin context.
4. Capture an offline field event with evidence, then reconnect and verify ordered synchronization.
5. Pilot scenario requests and approvals with a narrow manager scope before enabling automated policy actions.
