export function getCurrentPath(request: Request) {
  return new URL(request.url).pathname;
}

export function makeRedirectToFromHere(request: Request) {
  return new URLSearchParams([["redirectTo", getCurrentPath(request)]]);
}

export function getRedirectTo(request: Request, defaultRedirectTo = "/") {
  const url = new URL(request.url);
  return url.searchParams.get("redirectTo") ?? defaultRedirectTo;
}

// allow redirect on GET only
export function isGET(request: Request) {
  return request.method.toLowerCase() === "get";
}

export function notFound(message: string) {
  return new Response(message, { status: 404 });
}
