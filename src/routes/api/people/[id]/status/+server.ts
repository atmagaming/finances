import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/prisma";
import { getCachedPeople, invalidateCache } from "$lib/server/data";
import { syncPersonNotionPage } from "$lib/server/notion";

export const POST: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user?.canEditPeople) {
    return new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 });
  }

  const body = (await request.json()) as { status?: string; date?: string };
  const { status, date } = body;

  const validStatuses = ["working", "inactive", "vacation", "sick_leave"];
  if (!status || !validStatuses.includes(status)) {
    return new Response(JSON.stringify({ message: "Invalid status" }), { status: 400 });
  }

  const statusDate = date ?? new Date().toISOString().slice(0, 10);

  await prisma.personStatusChange.create({
    data: { personId: params.id, status, date: statusDate },
  });

  invalidateCache("people");

  if (status === "working" || status === "inactive") {
    try {
      const people = await getCachedPeople();
      const person = people.find((p) => p.id === params.id);
      if (person) await syncPersonNotionPage(person, status);
    } catch (e) {
      console.error("Notion sync failed:", e);
    }
  }

  return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
};
