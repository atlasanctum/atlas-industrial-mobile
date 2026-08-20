-- Atlas Industrial Systems initial access template.
-- Replace every ALL_CAPS placeholder before running this script in the Supabase SQL Editor.
-- Run supabase/atlas_schema.sql first.

insert into public.atlas_facilities (name, code)
values ('FACILITY_NAME', 'FACILITY_CODE')
on conflict (code) do update set name = excluded.name
returning id, name, code;

-- Copy the facility UUID returned above into FACILITY_UUID and enter the numeric
-- Manus user ID that appears after the first successful Atlas sign-in.
insert into public.atlas_members (
  manus_user_id,
  display_name,
  role,
  facility_ids,
  active
)
values (
  MANUS_USER_ID,
  'MEMBER_DISPLAY_NAME',
  'manager',
  array['FACILITY_UUID'::uuid],
  true
)
on conflict (manus_user_id) do update set
  display_name = excluded.display_name,
  role = excluded.role,
  facility_ids = excluded.facility_ids,
  active = excluded.active,
  updated_at = now()
returning id, manus_user_id, display_name, role, facility_ids, active;

-- For an operator, technician, inspector, executive, or auditor, replace the
-- role value above with the intended Atlas role. Only manager and executive
-- roles may authorize grounded recommendations in the current role matrix.
