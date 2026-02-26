import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch("/api/data/all");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to load dashboard data (${res.status})${body ? ": " + body : ""}`);
  }
  const data = await res.json();
  return { data };
};
