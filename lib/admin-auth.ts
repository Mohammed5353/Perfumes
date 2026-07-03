import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "scentora_admin_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  sub: string;
  email: string;
  name: string | null;
  role: "ADMIN";
  exp: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN";
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = scryptSync(password, salt, 64).toString("base64url");

  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, salt, expectedKey] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedKey) {
    return false;
  }

  const actualKey = scryptSync(password, salt, 64).toString("base64url");

  return safeEqual(actualKey, expectedKey);
}

export function verifyAdminPasswordFallback(password: string) {
  const fallbackPassword = process.env.ADMIN_PASSWORD || "admin123";

  return safeEqual(password, fallbackPassword);
}

export function createAdminSessionToken(user: AdminUser) {
  const payload: AdminSessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return parseAdminSessionToken(token);
}

export function getAdminApiKeyFromHeaders(headersLike?: Headers | Request | null) {
  const source = headersLike instanceof Request ? headersLike.headers : headersLike;

  if (!source) {
    return null;
  }

  const headerValue = source.get("x-api-key")?.trim();
  if (headerValue) {
    return headerValue;
  }

  const authorization = source.get("authorization")?.trim();
  if (!authorization) {
    return null;
  }

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  if (authorization.startsWith("Token ")) {
    return authorization.slice(6).trim();
  }

  return null;
}

export function isValidAdminApiKey(apiKey: string | null | undefined) {
  if (!apiKey) {
    return false;
  }

  const normalizedApiKey = apiKey.trim();
  const configuredKeys = [process.env.ADMIN_API_KEY, process.env.ADMIN_API_KEYS]
    .flatMap((value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    );

  return configuredKeys.some((configuredKey) => configuredKey === normalizedApiKey);
}

export async function requireAdminUser(request?: Request | null): Promise<AdminUser | null> {
  const incomingHeaders = request?.headers ?? (await headers());
  const apiKey = getAdminApiKeyFromHeaders(incomingHeaders);

  if (apiKey && isValidAdminApiKey(apiKey)) {
    return {
      id: "api-key",
      email: "admin@api",
      name: "API Key",
      role: "ADMIN",
    };
  }

  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  const { eq, db, users } = await loadAdminDb();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.sub),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: "ADMIN",
  };
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

async function loadAdminDb() {
  const [{ eq }, { db }, { users }] = await Promise.all([
    import("drizzle-orm"),
    import("@/lib/db"),
    import("@/lib/db/schema"),
  ]);

  return { eq, db, users };
}

function parseAdminSessionToken(token: string | undefined): AdminSessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !safeEqual(sign(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<AdminSessionPayload>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      payload.role !== "ADMIN" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      role: "ADMIN",
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    "scentora-local-admin-session-secret"
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
