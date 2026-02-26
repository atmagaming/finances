import type { RequestHandler } from "./$types";
import { randomBytes, createHash } from "node:crypto";
import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { prisma } from "$lib/server/prisma";
import { getSuperAdminEmails } from "$lib/server/admin";
import { getCachedPeople } from "$lib/server/data";
import { setSessionCookie } from "$lib/server/auth";

function base64url(input: Buffer) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export const GET: RequestHandler = async (event) => {
  const { url, cookies } = event;
  const code = url.searchParams.get("code");
  const redirectUri = `${publicEnv.PUBLIC_AUTH_URL ?? "http://localhost:3000"}/auth/google`;

  if (!code) {
    const clientId = env.GOOGLE_CLIENT_ID;
    if (!clientId) return new Response("Google OAuth not configured", { status: 500 });

    const state = randomBytes(16).toString("hex");
    const verifier = base64url(randomBytes(32));
    const challenge = base64url(createHash("sha256").update(verifier).digest());

    cookies.set("oauth_state", state, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 600 });
    cookies.set("oauth_verifier", verifier, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 600 });

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);

    return new Response(null, { status: 302, headers: { location: authUrl.toString() } });
  }

  const state = url.searchParams.get("state");
  const storedState = cookies.get("oauth_state");
  const verifier = cookies.get("oauth_verifier");

  cookies.delete("oauth_state", { path: "/" });
  cookies.delete("oauth_verifier", { path: "/" });

  if (!state || !storedState || state !== storedState || !verifier) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    return new Response(`Token exchange failed: ${text}`, { status: 400 });
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return new Response("Missing access token", { status: 400 });

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!profileRes.ok) return new Response("Failed to fetch user profile", { status: 400 });

  const profile = (await profileRes.json()) as { email?: string; name?: string; picture?: string };
  const email = profile.email as string | undefined;
  const name = profile.name ?? null;
  const image = profile.picture ?? null;

  if (!email) return new Response("Google account email is missing", { status: 400 });

  await prisma.user.upsert({
    where: { email },
    update: { name, image },
    create: { email, name, image },
  });

  const superAdminEmails = getSuperAdminEmails();
  const isSuperAdmin = superAdminEmails.includes(email);

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, canViewTransactions: true, canViewRevenueShares: true, canViewPersonalData: true, canEditPeople: true },
  });

  let personId: string | null = null;
  try {
    const people = await getCachedPeople();
    personId = people.find((p) => p.email === email)?.id ?? null;
  } catch (e) {
    console.error("Failed to resolve personId:", e);
  }

  setSessionCookie(event, {
    id: dbUser?.id ?? email,
    email,
    name,
    image,
    personId,
    isSuperAdmin,
    canViewTransactions: isSuperAdmin || (dbUser?.canViewTransactions ?? false),
    canViewRevenueShares: isSuperAdmin || (dbUser?.canViewRevenueShares ?? false),
    canViewPersonalData: isSuperAdmin || (dbUser?.canViewPersonalData ?? false),
    canEditPeople: isSuperAdmin || (dbUser?.canEditPeople ?? false),
  });

  return new Response(null, { status: 302, headers: { location: "/" } });
};
