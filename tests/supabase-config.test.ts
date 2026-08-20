import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

describe("Supabase project configuration", () => {
  it("accepts the configured public key at the Supabase auth settings endpoint", async () => {
    expect(supabaseUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(anonKey).toBeTruthy();

    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: anonKey as string,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    expect(response.ok).toBe(true);
  });
});
