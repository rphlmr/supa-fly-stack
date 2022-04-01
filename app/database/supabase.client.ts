import { createClient, SupabaseClient } from "@supabase/supabase-js";
export type { SupabaseClient };

declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_ANON_PUBLIC: string;
    };
  }
}

if (!window.ENV.SUPABASE_URL) throw new Error("SUPABASE_URL is not set");

if (!window.ENV.SUPABASE_ANON_PUBLIC)
  throw new Error("SUPABASE_ANON_PUBLIC is not set");

// const supabaseOptions = {
//   fetch, // see ⚠️ cloudflare
//   schema: "public",
//   persistSession: true,
//   autoRefreshToken: true,
//   detectSessionInUrl: true,
//   headers: { "x-application-name": "{my-site-name}" }
// };

// ⚠️ cloudflare needs you define fetch option : https://github.com/supabase/supabase-js#custom-fetch-implementation
// Use Remix fetch polyfill for node (See https://remix.run/docs/en/v1/other-api/node)

export function getSupabaseClient() {
  return createClient(
    window.ENV.SUPABASE_URL,
    window.ENV.SUPABASE_ANON_PUBLIC,
    {
      autoRefreshToken: false,
      persistSession: false,
    }
  );
}
