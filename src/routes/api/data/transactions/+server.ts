import type { RequestHandler } from "./$types";
import { getCachedPeople, getCachedTransactions } from "$lib/server/data";

export const GET: RequestHandler = async ({ locals }) => {
  const isAdmin = locals.user?.isAdmin ?? false;
  const isAuthenticated = !!locals.user;
  const userEmail = locals.user?.email ?? "";

  const [unsortedTransactions, people] = await Promise.all([getCachedTransactions(), getCachedPeople()]);

  const transactions = unsortedTransactions.toSorted((a, b) => b.logicalDate.localeCompare(a.logicalDate));

  const personEmailMap = new Map(people.map((p) => [p.id, p.email]));
  const personIdsInTransactions = new Set(transactions.filter((t) => t.personId).map((t) => t.personId as string));

  if (isAdmin) {
    const myPersonIds = people
      .filter((p) => p.email === userEmail && personIdsInTransactions.has(p.id))
      .map((p) => p.id);
    return new Response(JSON.stringify({ transactions, highlightPersonIds: myPersonIds, maskedPersonIds: [] }), {
      headers: { "content-type": "application/json" },
    });
  }

  const maskedPersonIds = isAuthenticated
    ? people.filter((p) => personEmailMap.get(p.id) !== userEmail && personIdsInTransactions.has(p.id)).map((p) => p.id)
    : [...personIdsInTransactions];

  const myPersonIds = isAuthenticated
    ? people.filter((p) => personEmailMap.get(p.id) === userEmail && personIdsInTransactions.has(p.id)).map((p) => p.id)
    : [];

  const maskedSet = new Set(maskedPersonIds);
  const maskedTransactions = transactions.map((t) =>
    t.personId && maskedSet.has(t.personId) ? { ...t, note: "Team Salaries", payeeName: "ATMA Team", category: "Salaries" } : t,
  );

  return new Response(
    JSON.stringify({ transactions: maskedTransactions, highlightPersonIds: myPersonIds, maskedPersonIds }),
    { headers: { "content-type": "application/json" } },
  );
};
