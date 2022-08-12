import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { getSupabaseAdmin } from "~/integrations/supabase";
import { requireAuthSession } from "~/modules/auth/guards";
import { commitAuthSession } from "~/modules/auth/session.server";

export async function action({ request }: ActionArgs) {
  const authSession = await requireAuthSession(request);
  const supabaseAdmin = getSupabaseAdmin();

  const { data: files } = await supabaseAdmin.storage
    .from("public")
    .list(authSession.userId);

  const userFiles =
    files?.map((file) => `${authSession.userId}/${file.name}`) ?? [];

  const { data, error } = await supabaseAdmin.storage
    .from("public")
    .remove(userFiles);

  if (!data || error)
    return json("Unable to delete file", {
      status: 500,
      headers: {
        "Set-Cookie": await commitAuthSession(request, { authSession }),
      },
    });

  return json(
    { success: true },
    {
      headers: {
        "Set-Cookie": await commitAuthSession(request, { authSession }),
      },
    }
  );
}
