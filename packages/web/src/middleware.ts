import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const jwksUri = process.env.LENS_JWKS_URI!;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

export const config = {
  matcher: ["/api/user"],
};

export async function middleware(req: NextRequest) {
  const { nextUrl, headers } = req;
  console.log(
    "middleware triggered for:",
    nextUrl.pathname,
    "headers:",
    headers,
    "secret:",
    process.env.MIDDLEWARE_SECRET,
  );

  if (process.env.VERCEL_ENV !== "production" || !nextUrl.pathname.startsWith("/api/user")) {
    return NextResponse.next();
  }

  const origin = headers.get("origin");
  if (origin !== process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const token = headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    const { sub, act } = payload;

    if (!sub || typeof sub !== "string") {
      console.error("Missing authorization subject header in payload", payload);
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!act || typeof act !== "string") {
      console.error("Missing authorization account header in payload", payload);
      return new NextResponse("Forbidden", { status: 403 });
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-sub", sub);
    requestHeaders.set("x-user-act", act);
    requestHeaders.set("x-secret", process.env.MIDDLEWARE_SECRET!);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }
}
