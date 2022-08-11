import { isBrowser } from "./is-browser";

declare global {
  interface Window {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_PUBLIC: string;
    };
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE: string;
      SERVER_URL: string;
      SUPABASE_ANON_PUBLIC: string;
      SESSION_SECRET: string;
    }
  }
}

function getEnv(name: string, isSecret = true) {
  if (isBrowser && isSecret) return "";

  const source = isBrowser ? window.env : process.env;

  const value = source[name as keyof typeof source];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

export const NODE_ENV = getEnv("NODE_ENV");
export const SERVER_URL = getEnv("SERVER_URL");
export const SUPABASE_URL = getEnv("SUPABASE_URL", false);
export const SUPABASE_ANON_PUBLIC = getEnv("SUPABASE_ANON_PUBLIC", false);
export const SUPABASE_SERVICE_ROLE = getEnv("SUPABASE_SERVICE_ROLE");
export const SESSION_SECRET = getEnv("SESSION_SECRET");

export function getBrowserEnv() {
  return {
    SUPABASE_URL,
    SUPABASE_ANON_PUBLIC,
  };
}
