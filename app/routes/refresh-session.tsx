import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { refreshAuthSession } from "~/modules/auth/mutations";
import { commitAuthSession } from "~/modules/auth/session.server";
import { assertIsPost } from "~/utils/http.server";

// this is just for supabase realtime session refresh
export async function action({ request }: ActionArgs) {
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
}
