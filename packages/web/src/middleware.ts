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

  if (process.env.VERCEL_ENV !== "production" || !nextUrl.pathname.startsWith("/api/user")) {
    return NextResponse.next();
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

    const account = (act as { sub: string }).sub;
    if (!account) {
      console.error("middleware: Missing authorization account header in payload", payload);
      return new NextResponse("Forbidden", { status: 403 });
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-sub", sub);
    requestHeaders.set("x-user-act", account);
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
