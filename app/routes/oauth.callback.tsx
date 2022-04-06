import { useEffect } from "react";

import { json, redirect } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useActionData, useSearchParams, useSubmit } from "@remix-run/react";
import { getFormData } from "remix-params-helper";
import { z } from "zod";

import { useSupabase } from "~/context/supabase";
import { getUserByEmail } from "~/models/user.server";
import { creatOAuthUser } from "~/services/auth.server";
import { commitUserSession, getUserSession } from "~/services/session.server";
import { mapSession } from "~/utils/session-mapper";

const ActionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userId: z.string(),
  email: z.string().email(),
  redirectTo: z.string().optional(),
  expiresIn: z.number(),
  expiresAt: z.number(),
});

// imagine a user go back after OAuth login success or type this URL
// we don't want him to fall in a black hole 👽
export const loader: LoaderFunction = async ({ request }) => {
  const userSession = await getUserSession(request);

  if (userSession) return redirect("/notes");

  return json({});
};

interface ActionData {
  message?: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }

  const form = await getFormData(request, ActionSchema);

  if (!form.success) {
    return json<ActionData>(
      {
        message: "invalid-token",
      },
      { status: 400 }
    );
  }

  const { redirectTo = "/notes", ...userSession } = form.data;

  // user have un account, skip creation part and just commit session
  if (await getUserByEmail(userSession.email)) {
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await commitUserSession(request, {
          userSession,
        }),
      },
    });
  }

  // first time sign in, let's create a brand-new User row in supabase
  const createUserError = await creatOAuthUser(
    userSession.userId,
    userSession.email
  );

  if (createUserError) {
    return json<ActionData>(
      {
        message: "create-user-error",
      },
      { status: 500 }
    );
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitUserSession(request, {
        userSession,
      }),
    },
  });
};

export default function LoginCallback() {
  const error = useActionData() as ActionData;
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/notes";
  const supabase = useSupabase();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, authSession) => {
        if (event === "SIGNED_IN") {
          // supabase sdk has ability to read url fragment that contains your token after third party provider redirects you here
          // this fragment url looks like https://.....#access_token=evxxxxxxxx&refresh_token=xxxxxx, and it's not readable server-side (Oauth security)
          // supabase auth listener gives us a user session, based on what it founds in this fragment url
          // we can't use it directly, client-side, because we can't access sessionStorage from here
          // so, we map what we need, and let's back-end to the work
          const userSession = mapSession(authSession!);
          const formData = new FormData();

          for (const [key, value] of Object.entries(userSession)) {
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
  }, [supabase, submit, redirectTo]);

  return error ? <div>{error.message}</div> : null;
}
