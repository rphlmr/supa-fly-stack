import { matchRequestUrl, rest } from "msw";

import {
  authSession,
  authAccount,
  SUPABASE_AUTH_USER_API,
  SUPABASE_URL,
  SUPABASE_AUTH_TOKEN_API,
  SUPABASE_AUTH_ADMIN_USER_API,
} from "mocks/handlers";
import { server } from "mocks/start";
import { USER_EMAIL, USER_ID, USER_PASSWORD } from "mocks/user";
import { createUser } from "~/models/user.server";

import {
  createUserAccount,
  getAuthByAccessToken,
  refreshAccessToken,
} from "./auth.server";

vitest.mock("../models/user.server", () => ({
  createUser: vitest.fn().mockResolvedValue({}),
}));

describe("auth.server : getAuthByAccessToken", () => {
  it("should fetch supabase getUser auth api", async () => {
    expect.assertions(3);

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

    const { error, user } = await getAuthByAccessToken("valid");

    server.events.removeAllListeners();

    expect(error).toBeNull();
    expect(user).toEqual({ id: USER_ID });
    expect(fetchAuthUserAPI.size).toEqual(1);
  });
});

describe("auth.server : refreshAccessToken", () => {
  it("should fetch supabase refreshAccessToken auth api", async () => {
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

    const { error, refreshedSession } = await refreshAccessToken("valid");

    server.events.removeAllListeners();

    expect(error).toBeNull();
    expect(refreshedSession).toEqual(authSession);
    expect(fetchAuthTokenAPI.size).toEqual(1);
  });

  it("should return error if unable refresh access token ", async () => {
    expect.assertions(2);

    const { error, refreshedSession } = await refreshAccessToken("invalid");

    server.events.removeAllListeners();

    expect(error).toEqual({
      message: "Token expired",
      status: 401,
    });
    expect(refreshedSession).toBeNull();
  });
});

describe("auth.server : signInWithEmail", () => {
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

    const result = await createUserAccount(USER_EMAIL, USER_PASSWORD);

    server.events.removeAllListeners();

    expect(result).toEqual(authSession);
    expect(fetchAuthTokenAPI.size).toEqual(1);
    const [signInRequest] = fetchAuthTokenAPI.values();
    expect(signInRequest.body).toEqual(
      JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
    );
  });
});

describe("auth.server : createNewUserAccount", () => {
  it("should return null if no auth account created", async () => {
    expect.assertions(3);

    const fetchAuthAdminUserAPI = new Map();

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "POST";
      const matchesUrl = matchRequestUrl(
        req.url,
        SUPABASE_AUTH_ADMIN_USER_API,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthAdminUserAPI.set(req.id, req);
    });

    // https://mswjs.io/docs/api/setup-server/use#one-time-override
    server.use(
      rest.post(
        `${SUPABASE_URL}${SUPABASE_AUTH_ADMIN_USER_API}`,
        async (req, res, ctx) =>
          res.once(
            ctx.status(400),
            ctx.json({ message: "create-account-error", status: 400 })
          )
      )
    );

    const result = await createUserAccount(USER_EMAIL, USER_PASSWORD);

    server.events.removeAllListeners();

    expect(result).toBeNull();
    expect(fetchAuthAdminUserAPI.size).toEqual(1);
    const [request] = fetchAuthAdminUserAPI.values();
    expect(request.body).toEqual(
      JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        email_confirm: true,
      })
    );
  });

  it("should return null and delete auth account if unable to sign in", async () => {
    expect.assertions(5);

    const fetchAuthTokenAPI = new Map();
    const fetchAuthAdminUserAPI = new Map();

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "POST";
      const matchesUrl = matchRequestUrl(
        req.url,
        SUPABASE_AUTH_TOKEN_API,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthTokenAPI.set(req.id, req);
    });

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "DELETE";
      const matchesUrl = matchRequestUrl(
        req.url,
        `${SUPABASE_AUTH_ADMIN_USER_API}/*`,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthAdminUserAPI.set(req.id, req);
    });

    server.use(
      rest.post(
        `${SUPABASE_URL}${SUPABASE_AUTH_TOKEN_API}`,
        async (req, res, ctx) =>
          res.once(
            ctx.status(400),
            ctx.json({ message: "sign-in-error", status: 400 })
          )
      )
    );

    const result = await createUserAccount(USER_EMAIL, USER_PASSWORD);

    server.events.removeAllListeners();

    expect(result).toBeNull();
    expect(fetchAuthTokenAPI.size).toEqual(1);
    const [signInRequest] = fetchAuthTokenAPI.values();
    expect(signInRequest.body).toEqual(
      JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD })
    );
    expect(fetchAuthAdminUserAPI.size).toEqual(1);
    // expect call delete auth account with the expected user id
    const [authAdminUserReq] = fetchAuthAdminUserAPI.values();
    expect(authAdminUserReq.url.pathname).toEqual(
      `${SUPABASE_AUTH_ADMIN_USER_API}/${USER_ID}`
    );
  });

  it("should return null and delete auth account if unable to create user in database", async () => {
    expect.assertions(4);

    const fetchAuthTokenAPI = new Map();
    const fetchAuthAdminUserAPI = new Map();

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "POST";
      const matchesUrl = matchRequestUrl(
        req.url,
        SUPABASE_AUTH_TOKEN_API,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthTokenAPI.set(req.id, req);
    });

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "DELETE";
      const matchesUrl = matchRequestUrl(
        req.url,
        `${SUPABASE_AUTH_ADMIN_USER_API}/*`,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthAdminUserAPI.set(req.id, req);
    });

    // @ts-expect-error missing vitest support
    createUser.mockReturnValueOnce({ createUserError: true });

    const result = await createUserAccount(USER_EMAIL, USER_PASSWORD);

    server.events.removeAllListeners();

    expect(result).toBeNull();
    expect(fetchAuthTokenAPI.size).toEqual(1);
    expect(fetchAuthAdminUserAPI.size).toEqual(1);

    // expect call delete auth account with the expected user id
    const [authAdminUserReq] = fetchAuthAdminUserAPI.values();
    expect(authAdminUserReq.url.pathname).toEqual(
      `${SUPABASE_AUTH_ADMIN_USER_API}/${USER_ID}`
    );
  });

  it("should create an account", async () => {
    expect.assertions(4);

    const fetchAuthAdminUserAPI = new Map();
    const fetchAuthTokenAPI = new Map();

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "POST";
      const matchesUrl = matchRequestUrl(
        req.url,
        SUPABASE_AUTH_ADMIN_USER_API,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthAdminUserAPI.set(req.id, req);
    });

    server.events.on("request:start", (req) => {
      const matchesMethod = req.method === "POST";
      const matchesUrl = matchRequestUrl(
        req.url,
        SUPABASE_AUTH_TOKEN_API,
        SUPABASE_URL
      ).matches;

      if (matchesMethod && matchesUrl) fetchAuthTokenAPI.set(req.id, req);
    });

    const result = await createUserAccount(USER_EMAIL, USER_PASSWORD);

    server.events.removeAllListeners();

    expect(createUser).toBeCalledWith(authAccount);
    expect(result).toEqual(authSession);
    expect(fetchAuthAdminUserAPI.size).toEqual(1);
    expect(fetchAuthTokenAPI.size).toEqual(1);
  });
});
