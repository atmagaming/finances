import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { SessionUser } from "$lib/types";

const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function base64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(base64, "base64");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest();
}

function getSecret() {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

export function createSessionToken(user: SessionUser) {
  const now = Date.now();
  const payload = {
    ...user,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const encoded = base64url(JSON.stringify(payload));
  const signature = sign(encoded, getSecret());
  return `${encoded}.${base64url(signature)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded, getSecret());
  const actual = base64urlDecode(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  const payloadRaw = base64urlDecode(encoded).toString("utf8");
  try {
    const payload = JSON.parse(payloadRaw) as SessionUser & { exp: number };
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(event: RequestEvent, user: SessionUser) {
  const token = createSessionToken(user);
  event.cookies.set(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(event: RequestEvent) {
  event.cookies.delete(SESSION_COOKIE, { path: "/" });
}

export function getSessionUser(event: RequestEvent): SessionUser | null {
  const token = event.cookies.get(SESSION_COOKIE);
  return verifySessionToken(token);
}
