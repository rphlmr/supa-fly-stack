import { createClient, SupabaseClient } from "@supabase/supabase-js";

declare global {
  var __sbc__: SupabaseClient;
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

let supabaseClient: SupabaseClient;

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

function getSupabaseClient() {
  return createClient(
    window.ENV.SUPABASE_URL,
    window.ENV.SUPABASE_ANON_PUBLIC,
    {
      autoRefreshToken: false,
      persistSession: false,
    }
  );
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to Supabase with every change either.
// in production, we'll have a single Supabase instance.
if (process.env.NODE_ENV === "production") {
  supabaseClient = getSupabaseClient();
} else {
  if (!global.__sbc__) {
    global.__sbc__ = getSupabaseClient();
  }
  supabaseClient = global.__sbc__;
}

export { supabaseClient };
