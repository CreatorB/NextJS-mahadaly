import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE = "mahadaly_session";

const STAGING_KEY = "bismillah";
const STAGING_COOKIE = "staging_key";
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes("tes") ?? false;

const ALLOWED_ORIGINS = [
  "http://localhost:8000",
  "http://192.168.50.100:8000",
  "http://127.0.0.1:8000",
  "https://teskias.syathiby.id",
  "https://kias.syathiby.id",
];

const CROSS_CARDS_PATH = "/api/cross-cards";

function isCrossCardsRequest(pathname: string): boolean {
  return pathname === CROSS_CARDS_PATH || pathname.startsWith(`${CROSS_CARDS_PATH}/`);
}

function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

async function getRole(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload as { roleId: number }).roleId ?? null;
  } catch {
    return null;
  }
}

function checkStagingKey(req: NextRequest): NextResponse | null {
  if (!isStaging) return null;
  const key = req.nextUrl.searchParams.get("key");
  const cookie = req.cookies.get(STAGING_COOKIE)?.value;
  if (key === STAGING_KEY || cookie === STAGING_KEY) {
    if (key === STAGING_KEY) {
      const response = NextResponse.next();
      response.cookies.set(STAGING_COOKIE, STAGING_KEY, {
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }
    return NextResponse.next();
  }
  return new NextResponse(
    `Akses ditolak. Buka https://tesmahadaly.syathiby.id/?key=${STAGING_KEY}`,
    { status: 401, headers: { "Content-Type": "text/plain" } },
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCrossCardsRequest(pathname)) {
    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      const origin = request.headers.get("origin");
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        preflight.headers.set("Access-Control-Allow-Origin", origin);
        preflight.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        preflight.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        preflight.headers.set("Access-Control-Max-Age", "86400");
        preflight.headers.set("Vary", "Origin");
      }
      return preflight;
    }

    const response = NextResponse.next();
    return applyCorsHeaders(request, response);
  }

  const keyGate = checkStagingKey(request);
  if (keyGate) return keyGate;

  const role = await getRole(request);

  if (pathname.startsWith("/dashboard")) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin/superadmin")) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
    if (role !== 1) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  } else if (pathname.startsWith("/admin")) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
    if (role > 2) return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && role) {
    if (role <= 2) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/api/cross-cards/:path*",
  ],
};
