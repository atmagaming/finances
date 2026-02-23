import { auth } from "@/auth";
import { TransactionsTable } from "@/components/transactions-table";
import { getCachedPayees, getCachedPeople, getCachedTransactions } from "@/lib/data";

export default async function TransactionsPage() {
  const session = await auth();
  const [transactions, payees, people] = await Promise.all([
    getCachedTransactions(),
    getCachedPayees(),
    getCachedPeople(),
  ]);

  const userEmail = session?.user?.email ?? "";

  // Build a set of payee IDs that belong to other team members
  const personEmailMap = new Map(people.map((p) => [p.id, p.notionEmail]));
  const otherPersonPayeeIds = new Set(
    payees.filter((p) => p.personId && personEmailMap.get(p.personId) !== userEmail).map((p) => p.id),
  );

  // Hide names of other people's payees
  const maskedTransactions = transactions.map((t) =>
    otherPersonPayeeIds.has(t.payeeId) ? { ...t, payeeName: "Team Salaries" } : t,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <TransactionsTable transactions={maskedTransactions} showPayee={!!session} />
    </div>
  );
}
