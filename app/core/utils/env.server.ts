declare global {
  interface Window {
    ENV: {
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
    }
  }
}

export const NODE_ENV = process.env.NODE_ENV;
export const SERVER_URL = process.env.SERVER_URL;

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_PUBLIC = process.env.SUPABASE_ANON_PUBLIC;
export const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
export const SESSION_SECRET = process.env.SESSION_SECRET;
