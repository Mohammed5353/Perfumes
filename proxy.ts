import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";

const HOME_SEEN_COOKIE = "scentora_home_seen";
const NEW_USER_HOME_PATH = "/home-2";
const PUBLIC_AUTH_PATHS = [
  "/sign-in",
  "/sign-up",
  "/sso-callback",
  "/logout",
  "/forgot-password",
];

const clerk = clerkMiddleware();

export function proxy(request: NextRequest, event: NextFetchEvent) {
  // Let Clerk handle auth/proxy endpoints first.
  const clerkResponse = clerk(request, event);
  if (clerkResponse) {
    return clerkResponse;
  }

  const { pathname } = request.nextUrl;
  const hasSeenHome = request.cookies.has(HOME_SEEN_COOKIE);
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (pathname.startsWith("/products")) {
    return NextResponse.next();
  }

  if (isPublicAuthPath && !hasSeenHome) {
    const response = NextResponse.next();
    response.cookies.set(HOME_SEEN_COOKIE, "1", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });

    return response;
  }

  if (
    pathname !== NEW_USER_HOME_PATH &&
    !hasSeenHome &&
    !isPublicAuthPath
  ) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = NEW_USER_HOME_PATH;
    homeUrl.search = "";

    const response = NextResponse.redirect(homeUrl);
    response.cookies.set(HOME_SEEN_COOKIE, "1", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });

    return response;
  }

  const response = NextResponse.next();

  if (pathname === NEW_USER_HOME_PATH && !hasSeenHome) {
    response.cookies.set(HOME_SEEN_COOKIE, "1", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Clerk proxy endpoints (must be reachable).
    "/__clerk/(.*)",
    // Everything else except static files and Next internals.
    "/((?!admin|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
