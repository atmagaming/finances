import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import { getSuperAdminEmails } from "$lib/server/admin";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user?.isSuperAdmin) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  const superAdminEmails = getSuperAdminEmails();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      canViewTransactions: true,
      canViewRevenueShares: true,
      canViewPersonalData: true,
      canEditPeople: true,
    },
  });

  return new Response(JSON.stringify({ users, superAdminEmails }), {
    headers: { "content-type": "application/json" },
  });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const superAdminEmails = getSuperAdminEmails();

  if (!locals.user?.email || !superAdminEmails.includes(locals.user.email)) {
    return new Response(JSON.stringify({ message: "Only super-admin can manage permissions" }), { status: 403 });
  }

  const { email, permission, value } = (await request.json()) as {
    email?: string;
    permission?: string;
    value?: boolean;
  };

  if (!email || !permission || value === undefined) {
    return new Response(JSON.stringify({ message: "email, permission and value are required" }), { status: 400 });
  }

  const allowed = ["canViewTransactions", "canViewRevenueShares", "canViewPersonalData", "canEditPeople"];
  if (!allowed.includes(permission)) {
    return new Response(JSON.stringify({ message: "Invalid permission" }), { status: 400 });
  }

  await prisma.user.upsert({
    where: { email },
    update: { [permission]: value },
    create: { email, [permission]: value },
  });

  return new Response(JSON.stringify({ success: true }));
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  const superAdminEmails = getSuperAdminEmails();

  if (!locals.user?.email || !superAdminEmails.includes(locals.user.email)) {
    return new Response(JSON.stringify({ message: "Only super-admin can remove permissions" }), { status: 403 });
  }

  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return new Response(JSON.stringify({ message: "Email is required" }), { status: 400 });
  }

  if (superAdminEmails.includes(email)) {
    return new Response(JSON.stringify({ message: "Cannot remove super-admin permissions" }), { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: {
      canViewTransactions: false,
      canViewRevenueShares: false,
      canViewPersonalData: false,
      canEditPeople: false,
    },
  });

  return new Response(JSON.stringify({ success: true }));
};
