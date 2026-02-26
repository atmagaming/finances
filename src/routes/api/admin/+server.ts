import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import { getSuperAdminEmails } from "$lib/server/admin";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user?.isAdmin) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  const superAdminEmails = getSuperAdminEmails();

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true },
  });

  return new Response(JSON.stringify({ admins, superAdminEmails }), {
    headers: { "content-type": "application/json" },
  });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const superAdminEmails = getSuperAdminEmails();

  if (!locals.user?.email || !superAdminEmails.includes(locals.user.email)) {
    return new Response(JSON.stringify({ message: "Only super-admin can add admins" }), { status: 403 });
  }

  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return new Response(JSON.stringify({ message: "Email is required" }), { status: 400 });
  }

  await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true },
    create: { email, isAdmin: true },
  });

  return new Response(JSON.stringify({ success: true }));
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  const superAdminEmails = getSuperAdminEmails();

  if (!locals.user?.email || !superAdminEmails.includes(locals.user.email)) {
    return new Response(JSON.stringify({ message: "Only super-admin can remove admins" }), { status: 403 });
  }

  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return new Response(JSON.stringify({ message: "Email is required" }), { status: 400 });
  }

  if (superAdminEmails.includes(email)) {
    return new Response(JSON.stringify({ message: "Cannot remove super-admin" }), { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { isAdmin: false },
  });

  return new Response(JSON.stringify({ success: true }));
};
