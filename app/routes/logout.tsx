import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { destroyAuthSession } from "~/core/auth/session.server";
import { assertIsPost } from "~/core/utils/http.server";

export const action: ActionFunction = async ({ request }) => {
  assertIsPost(request);

  return destroyAuthSession(request);
};

export const loader: LoaderFunction = async () => redirect("/");
