import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Protège les routes élève et admin côté edge.
 * La vérification fine (premium, propriété) est refaite côté serveur dans les pages/API.
 */
export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Les routes /admin exigent le rôle ADMIN.
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/courses/:path*",
    "/learn/:path*",
    "/resources/:path*",
    "/quiz/:path*",
    "/profile/:path*",
    "/progress/:path*",
    "/admin/:path*",
  ],
};
