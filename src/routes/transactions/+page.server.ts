import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch("/api/data/transactions");
  if (!res.ok) {
    throw new Error("Failed to load transactions");
  }
  const data = await res.json();
  return { data };
};
