import type { LoaderFunction } from "remix";
import { refreshSession } from "~/services/session.server";

export const loader: LoaderFunction = async ({ request }) =>
  refreshSession(request);
