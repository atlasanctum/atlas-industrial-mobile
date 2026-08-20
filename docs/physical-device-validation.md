# Atlas Physical-Device Validation

## Before the test

Apply `supabase/atlas_schema.sql` in the Supabase SQL Editor, then use `supabase/atlas_initial_access.template.sql` to create one facility and one active member record. Set the three Supabase deployment variables in the deployment environment: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is server-only and must never be added to a public Expo variable.

## Device path

Open the Atlas project’s QR code on a physical phone using Expo Go. Sign in from the **Live workspace** card, then reopen the app after authentication. The card should identify the assigned Atlas role and no longer show **Awaiting role assignment**. If it does, copy the numeric user ID from the authenticated server log or identity context into the `atlas_members.manus_user_id` value, then refresh the app.

To test the scanner, create a QR code containing `atlas://asset/ASSET_UUID`, where `ASSET_UUID` is an ID from `atlas_assets`. In Atlas, select **ACT → Scan an asset**, grant camera access, and scan the code. The confirmation must state that the identity was captured. The matching asset must either open its live passport or show a safe unavailable-context message if it is outside the user’s facility scope.

For an offline queue test, put the device into airplane mode after signing in. Scan the same QR code and confirm the scanner reports **Queued offline**. Return the device to an internet connection, open the Command screen, and select **Sync** in the Live workspace card. Verify that the queued count clears and that Supabase contains one `atlas_events` row with `event_type = 'asset_scanned'`, `source = 'mobile'`, and the original `client_event_id`. Repeat the scan once while online and verify the event is recorded without duplicate IDs.

## Acceptance criteria

The test passes when a role-scoped user can see the live workspace state, a QR scan creates one traceable event, an offline scan stays durable across a connection change, and synchronization removes only events acknowledged by the server. A user without an `atlas_members` record must not receive workspace records or approval authority.
