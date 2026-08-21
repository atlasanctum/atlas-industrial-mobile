# Atlas Extended Migration, Digital Twin, and Recovery Pilot

## Controlled scope

Use one approved facility, one production line, one manager, one production asset, and one recovery work item for the first Atlas advanced-operating-layer pilot. This narrow scope makes every effect attributable and allows the team to validate role boundaries, digital-twin state, telemetry provenance, scenarios, and approval records before expanding access.

## Prerequisites

| Requirement | Owner | Evidence of readiness |
|---|---|---|
| Supabase Management API access or SQL Editor access | Platform administrator | `atlas_schema.sql` can be applied in the target project. |
| Base Atlas member, facility, asset, and work records | Atlas administrator | The selected IDs have been checked in the target facility. |
| Approved telemetry source | Equipment or integration owner | The gateway identifier and metric units are documented. |
| Manager pilot participant | Operations sponsor | The member has the `manager` role and selected facility in `facility_ids`. |
| Physical device | Field pilot participant | Expo Go can access the current Atlas development build. |

## Execution order

1. Apply the entire `supabase/atlas_schema.sql` migration. Verify that the advanced tables—`atlas_relationships`, `atlas_twin_snapshots`, `atlas_memory_entries`, `atlas_scenarios`, `atlas_policies`, `atlas_agent_runs`, and `atlas_audit_log`—exist with row-level security enabled.
2. Copy `supabase/atlas_twin_pilot.template.sql` into the SQL Editor. Replace each `ANGLE_BRACKET` identifier with an approved production value. Never execute the template with placeholders or fabricated values.
3. Insert one measured `vibration_mm_s` reading through the approved gateway path. Confirm source, unit, timestamp, asset, and facility before committing it.
4. Open Atlas as the pilot manager. Confirm the Control Tower displays the affected operating dimension and the asset’s digital-twin state is visible in the manager facility scope.
5. In **Scenario Engine**, select the constrained-asset recovery scenario and submit it for authorization. Review assumptions, production, delivery, margin, and risk labels. Approve only after the manager validates those inputs.
6. Execute the approved recovery workflow outside the app only through the facility’s normal operating procedures. Record the verification event and outcome afterward, then add an institutional memory entry capturing the decision and lesson.

## Pilot exit criteria

The pilot is successful when the telemetry reading is visible in the asset context, the twin preserves current/historical/expected/predicted states, the scenario moves from awaiting approval to an audited manager decision, and the post-action outcome is retained in industrial memory. A failed or incomplete condition should be recorded as a learning entry; do not bypass the evidence or approval requirement to obtain a green result.
