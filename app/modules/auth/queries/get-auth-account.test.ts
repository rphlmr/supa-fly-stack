import { matchRequestUrl } from "msw";

import { server } from "mocks";
import { SUPABASE_AUTH_USER_API, SUPABASE_URL } from "mocks/handlers";
import { USER_ID } from "mocks/user";

import { getAuthAccountByAccessToken } from "./get-auth-account.server";

describe(getAuthAccountByAccessToken.name, () => {
  it("should fetch supabase getUser auth api", async () => {
    expect.assertions(2);

    const fetchAuthUserAPI = new Map();

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "GET";
      const matchesUrl = matchRequestUrl(
        req.url,
        SUPABASE_AUTH_USER_API,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthUserAPI.set(req.id, req);
    });

    const authAccount = await getAuthAccountByAccessToken("valid");

    server.events.removeAllListeners();

    expect(authAccount).toEqual({ id: USER_ID });
    expect(fetchAuthUserAPI.size).toEqual(1);
  });
});
