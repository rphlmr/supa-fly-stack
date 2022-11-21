import type { ReactElement } from "react";
import { createContext, useContext, useState, useMemo } from "react";

import { useFetcher } from "@remix-run/react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { useInterval, useMatchesData } from "~/hooks";
import type { AuthSession } from "~/modules/auth";
import { isBrowser } from "~/utils";

import { getSupabase } from "./client";

/**
 * This is how to use Supabase in the browser
 *
 * In root.tsx
 * 1 : Return the user auth session and browser env (SUPABASE_URL and SUPABASE_ANON_PUBLIC)
 *
 * import { getBrowserEnv } from "./utils/env";
 *
 * export async function loader({ request }: LoaderArgs) {
 *  const { accessToken, expiresAt, expiresIn } = (await getAuthSession(request)) || {};
 *
 *  return json({
 *    env: {
 *      SUPABASE_ANON_PUBLIC: process.env.SUPABASE_ANON_PUBLIC,
 *      SUPABASE_URL: process.env.SUPABASE_URL,
 *    },
 *    authSession: {
 *      accessToken,
 *      expiresAt,
 *      expiresIn,
 *    },
 *  });
 * }
 *
 *
 * 2 : Inject env in <script> tag.
 * Wrap <Outlet /> with <SupabaseProvider><Outlet /></SupabaseProvider>
 * authSession is used elsewhere with a special Remix hook ;)
 *
 * export default function App() {
 * const { env } = useLoaderData<typeof loader>();
 *
 * return (
 *   <html lang="en" className="h-screen bg-neutral-50 text-gray-900">
 *     <head>
 *       <Meta />
 *       <Links />
 *     </head>
 *     <body className="h-full">
 *       <SupabaseProvider>
 *         <Outlet />
 *       </SupabaseProvider>
 *       <ConditionalScrollRestoration />
 *       <script
 *         dangerouslySetInnerHTML={{
 *           __html: `window.env = ${JSON.stringify(env)}`,
 *         }}
 *       />
 *       <Scripts />
 *       <LiveReload />
 *     </body>
 *   </html>
 *  );
 * }
 *
 *
 * 3 : In the component you want to use supabase, use the hook useSupabase()
 *
 * export default function SubscribeToRealtime() {
 *  const [data, setData] = useState([])
 *  const supabase = useSupabase()
 *
 *  useEffect(() => {
 *    const channel = supabase
 *      .channel('test')
 *      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'test' }, (payload) => {
 *        setData((data) => [...data, payload.new])
 *     })
 *      .subscribe()
 *
 *    return () => {
 *      supabase.removeChannel(channel)
 *    }
 *  }, [session])
 *
 *  return <pre>{JSON.stringify({ data }, null, 2)}</pre>
 * }
 */

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

// in root.tsx, wrap <Outlet /> with <SupabaseProvider> to use supabase'browser client
export const SupabaseProvider = ({ children }: { children: ReactElement }) => {
  // what root loader data returns
  const { accessToken, expiresIn, expiresAt } = useOptionalAuthSession();
  const [currentExpiresAt, setCurrentExpiresAt] = useState<
    number | undefined
  >();
  const [supabase, setSupabase] = useState<SupabaseClient | undefined>(() => {
    // prevents server side initial state
    // init a default anonymous client in browser until we have an auth token
    if (isBrowser) return getSupabase();
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

  // when in browser
  // after root loader fetch, if user session is refresh, it's time to create a new supabase client
  if (isBrowser && expiresAt !== currentExpiresAt) {
    // recreate a supabase client to force provider's consumer to rerender
    const client = getSupabase(accessToken);

    // refresh provider's state
    setCurrentExpiresAt(expiresAt);
    setSupabase(client);
  }

  const value = useMemo(() => supabase, [supabase]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (isBrowser && context === undefined) {
    throw new Error(`useSupabase must be used within a SupabaseProvider.`);
  }

  return context;
};

// Remix feature here, we can "watch" root loader data
function useOptionalAuthSession(): Partial<AuthSession> {
  const data = useMatchesData<{ authSession: AuthSession }>("root");

  return data?.authSession || {};
}
