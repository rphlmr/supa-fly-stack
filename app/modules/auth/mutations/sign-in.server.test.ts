import { matchRequestUrl } from "msw";

import { server } from "mocks";
import {
  SUPABASE_URL,
  SUPABASE_AUTH_TOKEN_API,
  authSession,
} from "mocks/handlers";
import { USER_EMAIL, USER_PASSWORD } from "mocks/user";
import { signInWithEmail } from "~/modules/auth/mutations/sign-in.server";

vitest.mock("../models/user.server", () => ({
  createUser: vitest.fn().mockResolvedValue({}),
}));

describe(signInWithEmail.name, () => {
  it("should fetch supabase sign in auth api", async () => {
    expect.assertions(3);

    const fetchAuthTokenAPI = new Map();

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "POST";
      const matchesUrl = matchRequestUrl(
        req.url,
        SUPABASE_AUTH_TOKEN_API,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthTokenAPI.set(req.id, req);
    });

    const result = await signInWithEmail(USER_EMAIL, USER_PASSWORD);

    server.events.removeAllListeners();

    expect(result).toEqual(authSession);
    expect(fetchAuthTokenAPI.size).toEqual(1);
    const [signInRequest] = fetchAuthTokenAPI.values();
    expect(signInRequest.body).toEqual(
      JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        gotrue_meta_security: {},
      })
    );
  });
});
