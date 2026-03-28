// middleware.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const path = req.nextUrl.pathname;

    if (!token) {
      const loginUrl = new URL("/signin", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (path.startsWith("/user/student") && role !== "student") {
      const url = new URL("/unauthorized", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/user/pm") && role !== "pm") {
      const url = new URL("/unauthorized", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/user/head_pm") && role !== "head_pm") {
      const url = new URL("/unauthorized", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/user/course_lead") && role !== "course_lead") {
      const url = new URL("/unauthorized", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/user/web_dev") && role !== "web_dev") {
      const url = new URL("/unauthorized", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized() {
        return true;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: ["/user/:path*"],
};
