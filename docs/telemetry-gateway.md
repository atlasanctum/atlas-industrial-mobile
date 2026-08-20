# Atlas Telemetry Gateway Contract

## Deployment sequence

Apply the complete [`atlas_schema.sql`](../supabase/atlas_schema.sql) file in the Supabase SQL Editor before connecting a gateway. The schema creates `atlas_telemetry`, `atlas_operational_controls`, and `atlas_evidence` in addition to the existing workspace records. Create the first facility and role-scoped manager with [`atlas_initial_access.template.sql`](../supabase/atlas_initial_access.template.sql), then ensure each asset has the correct `atlas_assets.id` and `facility_id` before submitting any telemetry.

> The mobile app does **not** send telemetry directly. Keep gateway credentials in the equipment integration environment or a server-side connector; never place a Supabase service-role key in the Expo application bundle.

## Accepted telemetry record

Each gateway event should become one `atlas_telemetry` row. Use an idempotency strategy in the gateway, such as a unique source event identifier retained in gateway storage, before retrying a failed write.

| Field | Requirement | Example |
|---|---|---|
| `asset_id` | Existing `atlas_assets.id` UUID | Machine 14 UUID |
| `facility_id` | Matching `atlas_facilities.id` UUID | North Plant UUID |
| `metric` | One of the permitted metric codes | `temperature_c` |
| `value` | Numeric reading in the metric’s stated unit | `84` |
| `observed_at` | ISO 8601 timestamp from the source | `2026-08-20T08:42:00Z` |
| `source` | Traceable equipment/integration identifier | `opcua:north-plant-line2` |

The current supported metrics are `temperature_c` in °C, `vibration_mm_s` in mm/s, `runtime_hours` in hours, and `pressure_bar` in bar. Atlas presents the latest reading as a transparent maintenance signal and reports confidence from the number of recent readings available. A signal recommends human work; it does not automatically stop machinery or release work.

```sql
insert into public.atlas_telemetry
  (asset_id, facility_id, metric, value, observed_at, source)
values
  ('ASSET_UUID', 'FACILITY_UUID', 'temperature_c', 84, now(), 'opcua:north-plant-line2');
```

## Physical-device evidence validation

Install the current build through Expo Go or the published native build, sign in as a role with `evidence:upload`, and follow this sequence with network access available first.

1. Open **Operations** → **Quality** → **Capture verification**, complete the three checks, add a short evidence note, capture a photo, and record the inspection. Confirm the event and photo appear as queued, then clear from the queue after sync.
2. Open **ACT** → **Voice field report**, record a short observation, add an operational summary, and submit it. Confirm the audio remains local while queued and is removed only after the secure upload succeeds.
3. Disable connectivity before recording one additional inspection or voice report. Re-enable connectivity, open the same screen or the Operations workspace, and confirm the event and evidence queue both drain without duplicate follow-up tasks.

If an upload fails, retain the device log, the queue count, the approximate file size, and the authenticated role. Do not delete the local evidence manually; Atlas retries it safely when connectivity and authorization return.
