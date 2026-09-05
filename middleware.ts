import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rawCookie = request.cookies.get("dealflow360_uid")?.value;
  const isAuth = !!rawCookie;
  const cookieVal = rawCookie ? decodeURIComponent(rawCookie) : null;
  const role = cookieVal && cookieVal.includes(":") ? cookieVal.split(":")[1] : null;

  const isProtected =
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/backend") ||
    pathname.startsWith("/portal");

  // 1. Unauthenticated user accessing protected route -> redirect to login
  if (!isAuth && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Authenticated user access control
  if (isAuth && role) {
    // Already logged in user navigating to /login or /signup
    if (pathname === "/login" || pathname === "/signup") {
      return NextResponse.redirect(
        new URL(role === "customer" ? "/portal" : "/workspace", request.url)
      );
    }

    // Customer trying to access workspace or backend -> redirect to portal
    if (role === "customer" && (pathname.startsWith("/workspace") || pathname.startsWith("/backend"))) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    // Internal user trying to access customer portal -> redirect to workspace
    if (role !== "customer" && pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }

    // Sales rep trying to access backend or manager approval routes -> redirect to workspace
    if (role === "sales_rep") {
      if (pathname.startsWith("/backend") || pathname.startsWith("/workspace/approvals")) {
        return NextResponse.redirect(new URL("/workspace", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workspace/:path*", "/backend/:path*", "/portal/:path*", "/login", "/signup"],
};
