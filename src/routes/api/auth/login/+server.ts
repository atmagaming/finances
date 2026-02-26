import type { RequestHandler } from "./$types";
import { compare } from "bcryptjs";
import { prisma } from "$lib/server/prisma";
import { getSuperAdminEmails } from "$lib/server/admin";
import { getCachedPeople } from "$lib/server/data";
import { setSessionCookie } from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
  const { request, locals } = event;
  const { email, password } = (await request.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return new Response(JSON.stringify({ message: "Email and password are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return new Response(JSON.stringify({ message: "Invalid email or password" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return new Response(JSON.stringify({ message: "Invalid email or password" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const superAdminEmails = getSuperAdminEmails();
  const isSuperAdmin = superAdminEmails.includes(email);
  const isAdmin = isSuperAdmin || user.isAdmin;

  let personId: string | null = null;
  try {
    const people = await getCachedPeople();
    personId = people.find((p) => p.notionEmail === email)?.id ?? null;
  } catch (e) {
    console.error("Failed to resolve personId:", e);
  }

  const sessionUser = {
    id: user.id,
    email,
    name: user.name ?? null,
    image: user.image ?? null,
    personId,
    isAdmin,
    isSuperAdmin,
  };

  locals.user = sessionUser;
  setSessionCookie(event, sessionUser);

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
