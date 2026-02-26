import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const canViewPersonalData = locals.user?.canViewPersonalData ?? false;
  const canEditPeople = locals.user?.canEditPeople ?? false;

  const res = await fetch("/api/people");
  if (!res.ok) throw new Error("Failed to load people");

  const { people } = await res.json();

  return { people, canViewPersonalData, canEditPeople };
};
