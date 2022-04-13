import { isGet, getCurrentPath, getRedirectTo, makeRedirectToFromHere, notFound } from "./http.server";

describe("request.server : getCurrentPath", () => {
  it("should return current request url path", () => {
    expect(getCurrentPath(new Request("https://my-app.com/profile"))).toBe("/profile");
  });

  it("should return url redirectTo param value", () => {
    expect(getRedirectTo(new Request("https://my-app.com?redirectTo=/profile"))).toBe("/profile");
  });
});

describe("request.server : makeRedirectToFromHere", () => {
  it("should return search params with redirectTo set with current request url path", () => {
    expect(makeRedirectToFromHere(new Request("https://my-app.com/profile"))).toEqual(
      new URLSearchParams([["redirectTo", "/profile"]])
    );
  });

  it("should return url redirectTo param value", () => {
    expect(getRedirectTo(new Request("https://my-app.com?redirectTo=/profile"))).toBe("/profile");
  });
});

describe("request.server : getRedirectTo", () => {
  it("should return default redirectTo value", () => {
    expect(getRedirectTo(new Request("https://my-app.com"))).toBe("/");
  });

  it("should return url redirectTo param value", () => {
    expect(getRedirectTo(new Request("https://my-app.com?redirectTo=/profile"))).toBe("/profile");
  });
});

describe("request.server : isGET", () => {
  it("should return false for POST / PUT / PATCH / DELETE methods", () => {
    expect(isGet(new Request("", { method: "POST" }))).toBeFalsy();
    expect(isGet(new Request("", { method: "PUT" }))).toBeFalsy();
    expect(isGet(new Request("", { method: "PATCH" }))).toBeFalsy();
    expect(isGet(new Request("", { method: "DELETE" }))).toBeFalsy();
  });

  it("should return true for GET method", async () => {
    expect(isGet(new Request("", { method: "GET" }))).toBeTruthy();
  });
});

describe("request.server : notFound", () => {
  it("should return 404 status", () => {
    expect(notFound("").status).toBe(404);
  });

  it("should return message", async () => {
    expect(await notFound("not-found-message").text()).toBe("not-found-message");
  });
});
