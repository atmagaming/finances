import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import { invalidateCache } from "$lib/server/data";

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const allowed = [
    "name", "nickname", "image", "identification", "weeklySchedule",
    "hourlyRatePaid", "hourlyRateAccrued", "email", "notionPersonPageId",
    "telegramAccount", "discord", "linkedin", "description",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const person = await prisma.person.update({
    where: { id: params.id },
    data,
    include: { statusChanges: true, documents: true, roles: true },
  });

  invalidateCache("people");

  return new Response(JSON.stringify({ person }), { headers: { "content-type": "application/json" } });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user?.canEditPeople) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  await prisma.person.delete({ where: { id: params.id } });

  invalidateCache("people");

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
