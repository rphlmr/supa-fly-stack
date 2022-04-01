import type { LoaderFunction } from "remix";
import { commitUserSession, refreshSession } from "~/services/session.server";
import { ActionFunction, json } from "remix";

// this is just for supabase realtime session refresh
export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }

  const userSession = await refreshSession(request);

  return json(
    { success: true },
    {
      headers: {
        "Set-Cookie": await commitUserSession(request, {
          userSession,
        }),
      },
    }
  );
};

export const loader: LoaderFunction = async ({ request }) =>
  refreshSession(request);
