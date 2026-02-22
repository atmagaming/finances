import { getCachedTransactions } from "@/lib/data";
import { TransactionsTable } from "@/components/transactions-table";

export default async function TransactionsPage() {
  const transactions = await getCachedTransactions();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
