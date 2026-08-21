-- Atlas controlled digital-twin and recovery-pilot template.
-- Replace every ANGLE_BRACKET value with an approved production identifier.
-- Run only after atlas_schema.sql has completed successfully.

begin;

-- 1. Confirm the selected facility, manager, and production asset before inserting data.
select id, name, code from public.atlas_facilities where id = '<FACILITY_UUID>'::uuid;
select id, display_name, role, facility_ids from public.atlas_members where id = '<MANAGER_MEMBER_UUID>'::uuid;
select id, asset_code, name, status from public.atlas_assets where id = '<ASSET_UUID>'::uuid and facility_id = '<FACILITY_UUID>'::uuid;

-- 2. Insert a controlled, source-identified telemetry reading from an approved pilot gateway.
insert into public.atlas_telemetry (asset_id, facility_id, metric, value, observed_at, source)
values ('<ASSET_UUID>'::uuid, '<FACILITY_UUID>'::uuid, 'vibration_mm_s', <MEASURED_VIBRATION_MM_S>, '<OBSERVED_AT_ISO8601>'::timestamptz, 'approved_pilot_gateway');

-- 3. Store the four-state representation that is visible in the digital twin.
insert into public.atlas_twin_snapshots (asset_id, facility_id, state_type, state, evidence_state, observed_at)
values
('<ASSET_UUID>'::uuid, '<FACILITY_UUID>'::uuid, 'current', jsonb_build_object('summary', '<CURRENT_MEASURED_STATE>', 'source', 'approved_pilot_gateway'), 'verified', now()),
('<ASSET_UUID>'::uuid, '<FACILITY_UUID>'::uuid, 'historical', jsonb_build_object('summary', '<HISTORICAL_BASELINE_AND_WINDOW>', 'source', 'approved_baseline'), 'verified', now()),
('<ASSET_UUID>'::uuid, '<FACILITY_UUID>'::uuid, 'expected', jsonb_build_object('summary', '<APPROVED_PLAN_OR_LOAD_EXPECTATION>', 'source', 'approved_schedule'), 'verified', now()),
('<ASSET_UUID>'::uuid, '<FACILITY_UUID>'::uuid, 'predicted', jsonb_build_object('summary', '<PREDICTED_RISK_OR_CONSTRAINT>', 'model', '<MODEL_OR_RULE_IDENTIFIER>'), 'estimated', now());

-- 4. Link the physical asset, operating line, and active recovery work through explicit relationships.
insert into public.atlas_relationships (facility_id, source_type, source_id, relationship_type, target_type, target_id, provenance, confidence)
values
('<FACILITY_UUID>'::uuid, 'asset', '<ASSET_UUID>', 'constrains', 'line', '<PRODUCTION_LINE_ID>', 'pilot_configuration', 'verified'),
('<FACILITY_UUID>'::uuid, 'asset', '<ASSET_UUID>', 'has_recovery_work', 'work_item', '<WORK_ITEM_UUID>', 'pilot_configuration', 'verified')
on conflict do nothing;

-- 5. Record one manager-approved recovery scenario. Do not set status to approved until the manager has reviewed the live result.
insert into public.atlas_scenarios (facility_id, requested_by_member_id, scope_type, scope_id, premise, assumptions, projection, evidence_state, required_role, status)
values ('<FACILITY_UUID>'::uuid, '<MANAGER_MEMBER_UUID>'::uuid, 'asset', '<ASSET_UUID>', '<RECOVERY_PREMISE>', jsonb_build_object('capacity', '<CAPACITY_ASSUMPTION>', 'parts', '<PARTS_ASSUMPTION>', 'safety', '<SAFETY_ASSUMPTION>'), jsonb_build_object('production', '<EXPECTED_PRODUCTION_IMPACT>', 'delivery', '<EXPECTED_DELIVERY_IMPACT>', 'margin', '<EXPECTED_MARGIN_IMPACT>'), 'estimated', 'manager', 'awaiting_approval');

commit;

-- Post-commit verification. The expected result is one or more telemetry and twin rows in the selected facility scope.
select metric, value, observed_at, source from public.atlas_telemetry where asset_id = '<ASSET_UUID>'::uuid order by observed_at desc limit 5;
select state_type, state, evidence_state, observed_at from public.atlas_twin_snapshots where asset_id = '<ASSET_UUID>'::uuid order by observed_at desc;
select id, premise, status, required_role, created_at from public.atlas_scenarios where facility_id = '<FACILITY_UUID>'::uuid order by created_at desc limit 5;
