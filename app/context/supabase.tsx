import { createContext, ReactElement, useContext, useState } from "react";
import { useInterval, useMatchesData } from "~/utils/hooks";
import { useFetcher } from "remix";
import { RealtimeSession } from "~/services/session.server";
import { getSupabaseClient, SupabaseClient } from "~/database/supabase.client";

const isBrowser = typeof window !== "undefined";

// Remix feature here, we can "watch" root loader data
function useOptionalRealtimeSession(): Partial<RealtimeSession> {
  const data = useMatchesData<{ realtimeSession: RealtimeSession }>("root");

  return data?.realtimeSession || {};
}

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactElement }) => {
  // what root loader data returns
  const { accessToken, expiresIn, expiresAt } = useOptionalRealtimeSession();
  const [currentExpiresAt, setCurrentExpiresAt] = useState<
    number | undefined
  >();
  const [supabaseClient, setSupabaseClient] = useState<
    SupabaseClient | undefined
  >(() => {
    // prevents server side initial state
    if (isBrowser) return getSupabaseClient();
  });
  const refresh = useFetcher();

  // auto refresh session at expire time
  useInterval(() => {
    // refreshes only if expiresIn is defined
    // prevents refresh when user is not logged in
    if (expiresIn)
      refresh.submit(null, {
        method: "post",
        action: "/refresh-session",
      });
  }, expiresIn);

  // if code executed client side
  // after root loader fetch, if user session is refresh, it's time to refresh supabase client
  if (isBrowser && expiresAt !== currentExpiresAt) {
    // recreate a supabase client to force provider's consumer to rerender
    const client = getSupabaseClient();

    // if user is authenticated, set credential
    if (accessToken) client.auth.setAuth(accessToken);

    // refresh provider's state
    setCurrentExpiresAt(expiresAt);
    setSupabaseClient(client);
  }

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (isBrowser && context === undefined) {
    throw new Error(
      `useSupabaseClient must be used within a SupabaseClientProvider.`
    );
  }

  return context as SupabaseClient;
};
