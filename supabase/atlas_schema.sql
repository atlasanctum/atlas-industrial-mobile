-- Atlas Industrial Systems live workspace schema.
-- Apply this in the Supabase SQL Editor before setting the deployment variables.

create extension if not exists pgcrypto;

create table if not exists public.atlas_members (
  id uuid primary key default gen_random_uuid(),
  manus_user_id bigint not null unique,
  display_name text,
  role text not null check (role in ('operator', 'technician', 'inspector', 'manager', 'executive', 'auditor')),
  facility_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_assets (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  asset_code text not null unique,
  name text not null,
  asset_type text not null,
  status text not null default 'operating',
  health_score integer check (health_score between 0 and 100),
  serial_number text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_work_items (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  asset_id uuid references public.atlas_assets(id),
  title text not null,
  work_type text not null,
  status text not null default 'ready',
  priority text not null default 'normal',
  owner_member_id uuid references public.atlas_members(id),
  due_at timestamptz,
  procedure text,
  evidence_requirement text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  actor_member_id uuid not null references public.atlas_members(id),
  facility_id uuid references public.atlas_facilities(id),
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  source text not null default 'mobile',
  payload jsonb not null default '{}',
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_recommendations (
  id uuid primary key,
  facility_id uuid references public.atlas_facilities(id),
  requested_by_member_id uuid not null references public.atlas_members(id),
  decided_by_member_id uuid references public.atlas_members(id),
  question text not null,
  payload jsonb not null,
  status text not null default 'awaiting_authorization' check (status in ('awaiting_authorization', 'approved', 'rejected')),
  required_role text not null check (required_role in ('manager', 'executive')),
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_approvals (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid references public.atlas_recommendations(id),
  target_type text not null,
  target_id text not null,
  status text not null check (status in ('approved', 'rejected')),
  required_role text not null,
  requested_by_member_id uuid references public.atlas_members(id),
  decided_by_member_id uuid not null references public.atlas_members(id),
  decision_note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz not null default now()
);

create table if not exists public.atlas_operational_controls (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  asset_id uuid references public.atlas_assets(id),
  domain text not null check (domain in ('production', 'inventory', 'quality', 'safety')),
  title text not null,
  context text not null,
  detail text not null,
  status text not null default 'ready' check (status in ('ready', 'attention', 'blocked', 'verified')),
  severity text not null default 'normal' check (severity in ('normal', 'attention', 'high', 'critical')),
  required_evidence boolean not null default false,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_evidence (
  id uuid primary key default gen_random_uuid(),
  event_client_id uuid not null,
  actor_member_id uuid not null references public.atlas_members(id),
  facility_id uuid references public.atlas_facilities(id),
  entity_type text not null,
  entity_id text not null,
  storage_key text not null unique,
  storage_url text not null,
  content_type text not null,
  filename text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 16777216),
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_telemetry (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.atlas_assets(id),
  facility_id uuid references public.atlas_facilities(id),
  metric text not null check (metric in ('temperature_c', 'vibration_mm_s', 'runtime_hours', 'pressure_bar')),
  value numeric not null,
  observed_at timestamptz not null,
  source text not null default 'integration',
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_relationships (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  source_type text not null,
  source_id text not null,
  relationship_type text not null,
  target_type text not null,
  target_id text not null,
  provenance text not null default 'operational_event',
  confidence text not null default 'unknown' check (confidence in ('verified', 'likely', 'estimated', 'unknown')),
  evidence_event_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_twin_snapshots (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.atlas_assets(id),
  facility_id uuid references public.atlas_facilities(id),
  state_type text not null check (state_type in ('current', 'historical', 'expected', 'predicted')),
  state jsonb not null,
  evidence_state text not null default 'unknown' check (evidence_state in ('verified', 'likely', 'estimated', 'unknown')),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_memory_entries (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  asset_id uuid references public.atlas_assets(id),
  event_id uuid references public.atlas_events(id),
  actor_member_id uuid references public.atlas_members(id),
  event_summary text not null,
  decision_summary text,
  outcome_summary text,
  lesson text,
  evidence_state text not null default 'unknown' check (evidence_state in ('verified', 'likely', 'estimated', 'unknown')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_scenarios (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  requested_by_member_id uuid references public.atlas_members(id),
  scope_type text not null,
  scope_id text,
  premise text not null,
  assumptions jsonb not null default '{}',
  projection jsonb not null default '{}',
  evidence_state text not null default 'estimated' check (evidence_state in ('verified', 'likely', 'estimated', 'unknown')),
  required_role text not null default 'manager' check (required_role in ('manager', 'executive')),
  status text not null default 'draft' check (status in ('draft', 'awaiting_approval', 'approved', 'rejected', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_policies (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  title text not null,
  domain text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  conditions jsonb not null default '{}',
  action jsonb not null default '{}',
  required_roles text[] not null default '{}',
  auto_execute boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_agent_runs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  triggered_by_event_id uuid references public.atlas_events(id),
  agent_role text not null check (agent_role in ('operations', 'asset', 'supply', 'logistics', 'finance', 'quality', 'safety', 'project', 'executive')),
  context jsonb not null default '{}',
  finding jsonb not null default '{}',
  evidence_state text not null default 'unknown' check (evidence_state in ('verified', 'likely', 'estimated', 'unknown')),
  status text not null default 'completed' check (status in ('queued', 'running', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_audit_log (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.atlas_facilities(id),
  actor_member_id uuid references public.atlas_members(id),
  action_type text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists atlas_assets_facility_idx on public.atlas_assets(facility_id);
create index if not exists atlas_work_items_facility_idx on public.atlas_work_items(facility_id, updated_at desc);
create index if not exists atlas_events_facility_occurred_idx on public.atlas_events(facility_id, occurred_at desc);
create index if not exists atlas_recommendations_facility_created_idx on public.atlas_recommendations(facility_id, created_at desc);
create index if not exists atlas_controls_facility_status_idx on public.atlas_operational_controls(facility_id, status, updated_at desc);
create index if not exists atlas_evidence_event_idx on public.atlas_evidence(event_client_id, created_at desc);
create index if not exists atlas_telemetry_asset_observed_idx on public.atlas_telemetry(asset_id, observed_at desc);
create index if not exists atlas_relationships_source_idx on public.atlas_relationships(source_type, source_id, relationship_type);
create index if not exists atlas_twin_asset_observed_idx on public.atlas_twin_snapshots(asset_id, observed_at desc);
create index if not exists atlas_memory_facility_occurred_idx on public.atlas_memory_entries(facility_id, occurred_at desc);
create index if not exists atlas_scenarios_facility_created_idx on public.atlas_scenarios(facility_id, created_at desc);
create index if not exists atlas_agent_runs_facility_created_idx on public.atlas_agent_runs(facility_id, created_at desc);
create index if not exists atlas_audit_facility_created_idx on public.atlas_audit_log(facility_id, created_at desc);

alter table public.atlas_members enable row level security;
alter table public.atlas_facilities enable row level security;
alter table public.atlas_assets enable row level security;
alter table public.atlas_work_items enable row level security;
alter table public.atlas_events enable row level security;
alter table public.atlas_recommendations enable row level security;
alter table public.atlas_approvals enable row level security;
alter table public.atlas_operational_controls enable row level security;
alter table public.atlas_evidence enable row level security;
alter table public.atlas_telemetry enable row level security;
alter table public.atlas_relationships enable row level security;
alter table public.atlas_twin_snapshots enable row level security;
alter table public.atlas_memory_entries enable row level security;
alter table public.atlas_scenarios enable row level security;
alter table public.atlas_policies enable row level security;
alter table public.atlas_agent_runs enable row level security;
alter table public.atlas_audit_log enable row level security;

-- Atlas uses a server-only service-role key. Do not add anonymous policies unless
-- a separate client-side data access design has been reviewed and approved.
