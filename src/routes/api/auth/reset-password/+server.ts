import type { RequestHandler } from "./$types";
import { hash } from "bcryptjs";
import { prisma } from "$lib/server/prisma";

export const POST: RequestHandler = async ({ request }) => {
  const { token, password } = (await request.json()) as { token?: string; password?: string };

  if (!token || !password) {
    return new Response(JSON.stringify({ message: "Token and password are required" }), { status: 400 });
  }
  if (password.length < 8) {
    return new Response(JSON.stringify({ message: "Password must be at least 8 characters" }), { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return new Response(JSON.stringify({ message: "Invalid or expired token" }), { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return new Response(JSON.stringify({ success: true }));
};
