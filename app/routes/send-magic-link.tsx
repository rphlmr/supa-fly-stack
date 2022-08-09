import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getFormData } from "remix-params-helper";
import { z } from "zod";

import { sendMagicLink } from "~/modules/auth/mutations";
import { assertIsPost } from "~/utils/http.server";

const MagicLinkSchema = z.object({
  email: z
    .string()
    .email("invalid-email")
    .transform((email) => email.toLowerCase()),
});

export async function action({ request }: ActionArgs) {
  assertIsPost(request);

  const form = await getFormData(request, MagicLinkSchema);

  if (!form.success) {
    return json(
      {
        error: "invalid-email",
      },
      { status: 400 }
    );
  }

  const { error } = await sendMagicLink(form.data.email);

  if (error) {
    return json(
      {
        error: "unable-to-send-magic-link",
      },
      { status: 500 }
    );
  }

  return json({ error: null });
}
