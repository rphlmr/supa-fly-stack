import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";

import { logout } from "~/services/session.server";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }

  return logout(request);
};

export const loader: LoaderFunction = async () => redirect("/");
