export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const isAdmin = session?.user?.isAdmin ?? false;
  const isAuthenticated = !!session?.user;
  const userEmail = session?.user?.email ?? "";

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
    return { transactions, highlightPayeeIds: myPayeeIds, maskedPayeeIds: [] };
  }

  // Guests and non-admin users: mask person-linked payees
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

  return {
    transactions: maskedTransactions,
    highlightPayeeIds: myPayeeIds,
    maskedPayeeIds,
  };
});
