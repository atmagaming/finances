import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isPublic =
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname === "/login" ||
    req.nextUrl.pathname === "/reset-password";
  if (!isAuth && !isPublic) return NextResponse.redirect(new URL("/login", req.url));
});

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
