-- Atlas Industrial Network expansion.
-- Apply after atlas_schema.sql. This migration keeps network claims, visibility,
-- authorization, and audit state separate from the member's private operating data.

create table if not exists public.atlas_network_organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  organization_type text not null check (organization_type in ('manufacturer', 'supplier', 'logistics', 'quality_provider', 'warehouse', 'service_provider')),
  region text not null,
  verification_status text not null default 'provisional' check (verification_status in ('provisional', 'verified', 'restricted')),
  public_profile jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_network_certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.atlas_network_organizations(id),
  certificate_type text not null,
  certificate_reference text not null,
  issuer text,
  issued_at timestamptz,
  expires_at timestamptz,
  evidence_url text,
  verification_status text not null default 'provisional' check (verification_status in ('provisional', 'verified', 'expired', 'revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_network_capacity_offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.atlas_network_organizations(id),
  facility_id uuid references public.atlas_facilities(id),
  owner_member_id uuid references public.atlas_members(id),
  capability text not null,
  available_hours numeric not null check (available_hours > 0),
  earliest_start timestamptz not null,
  lead_time_days integer not null check (lead_time_days >= 0),
  cost_index numeric check (cost_index between 0 and 100),
  quality_score numeric check (quality_score between 0 and 100),
  reliability_score numeric check (reliability_score between 0 and 100),
  resilience_score numeric check (resilience_score between 0 and 100),
  impact_score numeric check (impact_score between 0 and 100),
  certifications text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private', 'partner', 'consortium', 'public')),
  allowed_member_ids uuid[] not null default '{}',
  active boolean not null default true,
  provenance jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_network_demands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.atlas_network_organizations(id),
  requested_by_member_id uuid references public.atlas_members(id),
  title text not null,
  required_capability text not null,
  required_hours numeric not null check (required_hours > 0),
  due_at timestamptz,
  minimum_quality numeric check (minimum_quality between 0 and 100),
  required_certification text,
  region text,
  visibility text not null default 'private' check (visibility in ('private', 'partner', 'consortium', 'public')),
  allowed_member_ids uuid[] not null default '{}',
  status text not null default 'open' check (status in ('draft', 'open', 'matched', 'closed', 'cancelled')),
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_network_matches (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.atlas_network_demands(id),
  offer_id uuid not null references public.atlas_network_capacity_offers(id),
  requested_by_member_id uuid references public.atlas_members(id),
  approved_by_member_id uuid references public.atlas_members(id),
  objective text not null check (objective in ('best_overall', 'lowest_cost', 'fastest', 'highest_quality', 'lowest_risk', 'most_resilient', 'lowest_impact')),
  score numeric not null check (score between 0 and 100),
  explanation jsonb not null default '[]',
  evidence_state text not null default 'unknown' check (evidence_state in ('verified', 'likely', 'estimated', 'unknown')),
  status text not null default 'awaiting_approval' check (status in ('draft', 'awaiting_approval', 'approved', 'rejected', 'accepted', 'expired')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.atlas_network_transactions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.atlas_network_matches(id),
  title text not null,
  stage text not null check (stage in ('demand', 'offer', 'authorization', 'production', 'inspection', 'shipment', 'delivery', 'invoice', 'settlement')),
  evidence_state text not null default 'unknown' check (evidence_state in ('verified', 'likely', 'estimated', 'unknown')),
  authorization_required boolean not null default true,
  partner_organization_ids uuid[] not null default '{}',
  record jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_network_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.atlas_network_organizations(id),
  title text not null,
  policy_type text not null check (policy_type in ('sharing', 'matching', 'autonomy', 'transaction', 'reputation', 'dispute')),
  rules jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.atlas_network_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_member_id uuid references public.atlas_members(id),
  action_type text not null,
  target_type text not null,
  target_id text not null,
  data_visibility text check (data_visibility in ('private', 'partner', 'consortium', 'public')),
  provenance jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists atlas_network_offer_active_capability_idx on public.atlas_network_capacity_offers(active, capability, visibility, earliest_start);
create index if not exists atlas_network_demand_open_capability_idx on public.atlas_network_demands(status, required_capability, due_at);
create index if not exists atlas_network_match_demand_idx on public.atlas_network_matches(demand_id, status, created_at desc);
create index if not exists atlas_network_transaction_stage_idx on public.atlas_network_transactions(stage, updated_at desc);

alter table public.atlas_network_organizations enable row level security;
alter table public.atlas_network_certificates enable row level security;
alter table public.atlas_network_capacity_offers enable row level security;
alter table public.atlas_network_demands enable row level security;
alter table public.atlas_network_matches enable row level security;
alter table public.atlas_network_transactions enable row level security;
alter table public.atlas_network_policies enable row level security;
alter table public.atlas_network_audit_log enable row level security;

-- Use server-only service-role access. Visibility is enforced in Atlas service procedures
-- and must not be bypassed by anonymous client policies.
