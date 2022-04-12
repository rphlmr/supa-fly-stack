import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { refreshAuthSession } from "~/core/auth/mutations";
import { commitAuthSession } from "~/core/auth/session.server";
import { assertIsPost } from "~/core/utils/http.server";

// this is just for supabase realtime session refresh
export const action: ActionFunction = async ({ request }) => {
  assertIsPost(request);

  const authSession = await refreshAuthSession(request);

  return json(
    { success: true },
    {
      headers: {
        "Set-Cookie": await commitAuthSession(request, {
          authSession,
        }),
      },
    }
  );
};

export const loader: LoaderFunction = async ({ request }) => refreshAuthSession(request);
