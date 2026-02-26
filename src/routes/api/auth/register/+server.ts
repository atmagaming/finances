import type { RequestHandler } from "./$types";
import { hash } from "bcryptjs";
import { prisma } from "$lib/server/prisma";

export const POST: RequestHandler = async ({ request }) => {
  const { email, password, name } = (await request.json()) as { email?: string; password?: string; name?: string };

  if (!email || !password) {
    return new Response(JSON.stringify({ message: "Email and password are required" }), { status: 400 });
  }
  if (password.length < 8) {
    return new Response(JSON.stringify({ message: "Password must be at least 8 characters" }), { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return new Response(JSON.stringify({ message: "Email already registered" }), { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { email, name, passwordHash } });

  return new Response(JSON.stringify({ success: true }));
};
