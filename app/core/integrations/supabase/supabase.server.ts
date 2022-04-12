import { createClient } from "@supabase/supabase-js";

import type { SupabaseClient } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __sba__: SupabaseClient;
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE: string;
      SERVER_URL: string;
    }
  }
}

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not set");
}

if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error("SUPABASE_SERVICE_ROLE is not set");
}

if (!process.env.SERVER_URL) throw new Error("SERVER_URL is not set");

let supabaseAdmin: SupabaseClient;

// ⚠️ cloudflare needs you define fetch option : https://github.com/supabase/supabase-js#custom-fetch-implementation
// Use Remix fetch polyfill for node (See https://remix.run/docs/en/v1/other-api/node)

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
    autoRefreshToken: false,
    persistSession: false,
  });
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to Supabase with every change either.
// in production, we'll have a single Supabase instance.
if (process.env.NODE_ENV === "production") {
  supabaseAdmin = getSupabaseAdmin();
} else {
  if (!global.__sba__) {
    global.__sba__ = getSupabaseAdmin();
  }
  supabaseAdmin = global.__sba__;
}

export { supabaseAdmin };
