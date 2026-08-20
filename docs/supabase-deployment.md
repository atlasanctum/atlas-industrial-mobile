# Atlas Supabase Deployment

Atlas reads and writes operational data through the server, keeping the Supabase service-role key out of the Expo bundle. Before publishing, apply [`supabase/atlas_schema.sql`](../supabase/atlas_schema.sql) in the Supabase SQL Editor. Then add `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment. The public anonymous key is used only for project validation and must remain protected by Supabase Row Level Security; Atlas itself uses the service role from the server for controlled operations.

The first operational user requires a member record. Insert the authenticated user’s Manus numeric user ID into `atlas_members` with one of the supported roles, a display name, and any facility UUIDs they may access. The mobile workspace returns an **awaiting role assignment** state until that record exists. This intentional gate prevents a newly authenticated user from reading or recording industrial data before authorization is established.

The schema enables Row Level Security on all Atlas tables and intentionally omits anonymous policies because the Expo client does not query Supabase directly. All workspace, sync, intelligence, and approval calls route through authenticated server procedures, which evaluate the Atlas role matrix before data access or mutation.
