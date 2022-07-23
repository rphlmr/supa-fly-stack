import { createClient } from "@supabase/supabase-js";

import {
  NODE_ENV,
  SERVER_URL,
  SUPABASE_SERVICE_ROLE,
  SUPABASE_URL,
  SUPABASE_ANON_PUBLIC,
} from "~/core/utils/env.server";

import type { SupabaseClient } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __sba__: SupabaseClient;
}

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not set");
}

if (!SUPABASE_SERVICE_ROLE) {
  throw new Error("SUPABASE_SERVICE_ROLE is not set");
}

if (!SUPABASE_ANON_PUBLIC) {
  throw new Error("SUPABASE_ANON_PUBLIC is not set");
}

if (!SERVER_URL) throw new Error("SERVER_URL is not set");

let supabaseAdmin: SupabaseClient;

// ⚠️ cloudflare needs you define fetch option : https://github.com/supabase/supabase-js#custom-fetch-implementation
// Use Remix fetch polyfill for node (See https://remix.run/docs/en/v1/other-api/node)

type ClientOptions = {
  type: "admin" | "anon";
};

function getSupabaseClient({ type }: ClientOptions = { type: "anon" }) {
  return createClient(
    SUPABASE_URL,
    type === "admin" ? SUPABASE_SERVICE_ROLE : SUPABASE_ANON_PUBLIC,
    {
      autoRefreshToken: false,
      persistSession: false,
    }
  );
}

/**
 * Provide a Supabase Client for the logged in user.
 * It's a per request scoped client to prevent leaking access token over multiple concurrent requests and from different users.
 */
function supabase(accessToken: string) {
  if (!accessToken) {
    throw new Error(
      "accessToken is required to provide a supabase client linked to an user"
    );
  }

  const supabase = getSupabaseClient();
  supabase.auth.setAuth(accessToken);

  return supabase;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to Supabase with every change either.
// in production, we'll have a single Supabase instance.
if (NODE_ENV === "production") {
  supabaseAdmin = getSupabaseClient({ type: "admin" });
} else {
  if (!global.__sba__) {
    global.__sba__ = getSupabaseClient({ type: "admin" });
  }
  supabaseAdmin = global.__sba__;
}

export { supabaseAdmin, supabase };
