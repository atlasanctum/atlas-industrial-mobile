type SupabaseRequestOptions = RequestInit & { path: string };

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export class SupabaseRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "SupabaseRequestError";
  }
}

export function getSupabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new SupabaseConfigurationError("Supabase is not configured. Add the deployment environment variables before enabling live workspace access.");
  }
  return { url, serviceRoleKey };
}

export function isSupabaseConfigured() {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function supabaseRequest<T>({ path, headers, ...init }: SupabaseRequestOptions): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new SupabaseRequestError(response.status, text || `Supabase request failed with ${response.status}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}
