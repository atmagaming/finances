import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }
  if (!locals.user.isSuperAdmin) {
    throw redirect(302, "/");
  }

  const res = await fetch("/api/admin");
  if (!res.ok) {
    throw new Error("Failed to load admin data");
  }
  const data = await res.json();
  return { data };
};
