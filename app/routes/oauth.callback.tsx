import { useEffect } from "react";

import { json, redirect } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useActionData, useSearchParams, useSubmit } from "@remix-run/react";
import { getFormData } from "remix-params-helper";
import { z } from "zod";

import { commitAuthSession, getAuthSession } from "~/core/auth/session.server";
import { mapAuthSession } from "~/core/auth/utils/map-auth-session";
import { getSupabaseClient } from "~/core/integrations/supabase/supabase.client";
import { assertIsPost } from "~/core/utils/http.server";
import { tryCreateUser } from "~/modules/user/mutations";
import { getUserByEmail } from "~/modules/user/queries";

// imagine a user go back after OAuth login success or type this URL
// we don't want him to fall in a black hole 👽
export const loader: LoaderFunction = async ({ request }) => {
  const authSession = await getAuthSession(request);

  if (authSession) return redirect("/notes");

  return json({});
};

interface ActionData {
  message?: string;
}

export const action: ActionFunction = async ({ request }) => {
  assertIsPost(request);

  const schema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    userId: z.string(),
    email: z.string().email(),
    redirectTo: z.string().optional(),
    expiresIn: z.number(),
    expiresAt: z.number(),
  });

  const form = await getFormData(request, schema);

  if (!form.success) {
    return json<ActionData>(
      {
        message: "invalid-token",
      },
      { status: 400 }
    );
  }

  const { redirectTo = "/notes", ...authSession } = form.data;

  // user have un account, skip creation part and just commit session
  if (await getUserByEmail(authSession.email)) {
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await commitAuthSession(request, {
          authSession,
        }),
      },
    });
  }

  // first time sign in, let's create a brand-new User row in supabase
  const user = await tryCreateUser(authSession);

  if (!user) {
    return json<ActionData>(
      {
        message: "create-user-error",
      },
      { status: 500 }
    );
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitAuthSession(request, {
        authSession,
      }),
    },
  });
};

export default function LoginCallback() {
  const error = useActionData() as ActionData;
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/notes";

  useEffect(() => {
    const supabase = getSupabaseClient();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, supabaseSession) => {
        if (event === "SIGNED_IN") {
          // supabase sdk has ability to read url fragment that contains your token after third party provider redirects you here
          // this fragment url looks like https://.....#access_token=evxxxxxxxx&refresh_token=xxxxxx, and it's not readable server-side (Oauth security)
          // supabase auth listener gives us a user session, based on what it founds in this fragment url
          // we can't use it directly, client-side, because we can't access sessionStorage from here
          // so, we map what we need, and let's back-end to the work
          const authSession = mapAuthSession(supabaseSession);

          if (!authSession) return;

          const formData = new FormData();

          for (const [key, value] of Object.entries(authSession)) {
            formData.append(key, value as string);
          }

          formData.append("redirectTo", redirectTo);

          submit(formData, { method: "post", replace: true });
        }
      }
    );

    return () => {
      // prevent memory leak. Listener stays alive 👨‍🎤
      authListener?.unsubscribe();
    };
  }, [submit, redirectTo]);

  return error ? <div>{error.message}</div> : null;
}
