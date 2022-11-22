import type { ReactElement } from "react";
import { createContext, useContext, useState, useMemo } from "react";

import { useFetcher } from "@remix-run/react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { useInterval } from "~/hooks";
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
 *  const { supabaseClient, accessToken } = useSupabase()
 *
 *  useEffect(() => {
 *    if (!supabaseClient || !accessToken) return;
 *
 *    const channel = supabaseClient
 *      .channel('test')
 *      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'test' }, (payload) => {
 *        // do something with the payload. You can even trigger Remix to reload data :)
 *        // fetcher.submit(null, { method: "post" }); to trigger a route action that will reload all loaders
 *        setData((data) => [...data, payload.new])
 *     })
 *      .subscribe()
 *
 *    channel.socket.setAuth(accessToken);
 *
 *    return () => {
 *      supabaseClient.removeChannel(channel)
 *    }
 *  }, [session])
 *
 *  return <pre>{JSON.stringify({ data }, null, 2)}</pre>
 * }
 */

const SupabaseContext = createContext<{
  supabaseClient: SupabaseClient | undefined;
  accessToken: string | undefined;
}>({ supabaseClient: undefined, accessToken: undefined });

// in root.tsx, wrap <Outlet /> with <SupabaseProvider authSession={authSession}> to use supabase'browser client
export const SupabaseProvider = ({
  children,
  authSession,
}: {
  children: ReactElement;
  authSession: Partial<AuthSession>;
}) => {
  // what root loader data returns
  const { accessToken, expiresIn, expiresAt } = authSession;
  const [browserSessionExpiresAt, setBrowserSessionExpiresAt] = useState<
    number | undefined
  >();
  const [supabaseClient, setSupabaseClient] = useState<
    SupabaseClient | undefined
  >(() => {
    // prevents server side initial state
    // init a default anonymous client in browser until we have an auth token
    if (isBrowser) return getSupabase();
  });
  const refresh = useFetcher();

  // trigger a refresh session at expire time. We'll send a post request to our resource route /refresh-session
  useInterval(() => {
    // ask to refresh only if expiresIn is defined
    // prevents trying to refresh when user is not logged in
    if (expiresIn)
      refresh.submit(null, {
        method: "post",
        action: "/refresh-session",
      });
  }, expiresIn);

  // when in browser
  // after root loader fetch, if user session is refresh, it's time to create a new supabase client
  if (isBrowser && expiresAt !== browserSessionExpiresAt && accessToken) {
    // recreate a supabase client to force provider's consumer to rerender
    setSupabaseClient(getSupabase(accessToken));
    setBrowserSessionExpiresAt(expiresAt);
  }

  const value = useMemo(
    () => ({ supabaseClient, accessToken }),
    [supabaseClient, accessToken]
  );

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
