import type { RequestHandler } from "./$types";
import { getCachedPayees, getCachedPeople, getCachedTransactions } from "$lib/server/data";

export const GET: RequestHandler = async ({ locals }) => {
  const isAdmin = locals.user?.isAdmin ?? false;
  const isAuthenticated = !!locals.user;
  const userEmail = locals.user?.email ?? "";

  const [unsortedTransactions, payees, people] = await Promise.all([
    getCachedTransactions(),
    getCachedPayees(),
    getCachedPeople(),
  ]);

  const transactions = unsortedTransactions.toSorted((a, b) => b.logicalDate.localeCompare(a.logicalDate));

  const personEmailMap = new Map(people.map((p) => [p.id, p.notionEmail]));
  const personPayeeIds = payees.filter((p) => p.personId).map((p) => p.id);

  if (isAdmin) {
    const myPayeeIds = payees
      .filter((p) => p.personId && personEmailMap.get(p.personId) === userEmail)
      .map((p) => p.id);
    return new Response(JSON.stringify({ transactions, highlightPayeeIds: myPayeeIds, maskedPayeeIds: [] }), {
      headers: { "content-type": "application/json" },
    });
  }

  const maskedPayeeIds = isAuthenticated
    ? payees.filter((p) => p.personId && personEmailMap.get(p.personId) !== userEmail).map((p) => p.id)
    : personPayeeIds;

  const myPayeeIds = isAuthenticated
    ? payees.filter((p) => p.personId && personEmailMap.get(p.personId) === userEmail).map((p) => p.id)
    : [];

  const maskedSet = new Set(maskedPayeeIds);
  const maskedTransactions = transactions.map((t) =>
    maskedSet.has(t.payeeId) ? { ...t, note: "Team Salaries", payeeName: "ATMA Team", category: "Salaries" } : t,
  );

  return new Response(
    JSON.stringify({ transactions: maskedTransactions, highlightPayeeIds: myPayeeIds, maskedPayeeIds }),
    {
      headers: { "content-type": "application/json" },
    },
  );
};
