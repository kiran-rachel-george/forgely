import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_MATCHERS = ["/dashboard", "/project"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProtected = PROTECTED_MATCHERS.some((path) => pathname.startsWith(path));
  const isProjectPage = pathname.startsWith("/project/");

  // Redirect unauthenticated users
  if (isProtected) {
    const token = req.cookies.get("sb-access-token")?.value;

    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
  }

  // Add COEP/COOP headers for project pages (required for WebContainer/SharedArrayBuffer)
  if (isProjectPage) {
    const response = NextResponse.next();
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/project/:path*"],
};
