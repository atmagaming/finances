"use client";

import { useMemo, useState } from "react";
import type { Transaction } from "@/lib/types";

type SortField = "logicalDate" | "amount" | "usdEquivalent" | "method" | "category" | "payeeName";
type SortDir = "asc" | "desc";

export function TransactionsTable({
  transactions,
  showPayee = true,
}: {
  transactions: Transaction[];
  showPayee?: boolean;
}) {
  const [sortField, setSortField] = useState<SortField>("logicalDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(
    () => [...new Set(transactions.map((t) => t.category).filter(Boolean))].sort(),
    [transactions],
  );
  const methods = ["Paid", "Accrued", "Invested"];

  const filtered = useMemo(() => {
    let result = transactions;
    if (methodFilter !== "all") result = result.filter((t) => t.method === methodFilter);
    if (categoryFilter !== "all") result = result.filter((t) => t.category === categoryFilter);
    return result;
  }, [transactions, methodFilter, categoryFilter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const cmp =
          typeof aVal === "number" && typeof bVal === "number" ? aVal - bVal : String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      }),
    [filtered, sortField, sortDir],
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const headerClass =
    "cursor-pointer select-none px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)]";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div className="flex gap-4 border-b border-[var(--border)] p-4">
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)]"
        >
          <option value="all">All Methods</option>
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-sm text-[var(--text-muted)]">{sorted.length} transactions</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className={headerClass} onClick={() => toggleSort("logicalDate")}>
                Date {sortField === "logicalDate" ? (sortDir === "asc" ? "^" : "v") : ""}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Description
              </th>
              {showPayee && (
                <th className={headerClass} onClick={() => toggleSort("payeeName")}>
                  Payee {sortField === "payeeName" ? (sortDir === "asc" ? "^" : "v") : ""}
                </th>
              )}
              <th className={headerClass} onClick={() => toggleSort("category")}>
                Category {sortField === "category" ? (sortDir === "asc" ? "^" : "v") : ""}
              </th>
              <th className={headerClass} onClick={() => toggleSort("method")}>
                Method {sortField === "method" ? (sortDir === "asc" ? "^" : "v") : ""}
              </th>
              <th className={headerClass} onClick={() => toggleSort("usdEquivalent")}>
                USD {sortField === "usdEquivalent" ? (sortDir === "asc" ? "^" : "v") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <td className="whitespace-nowrap px-3 py-2 text-sm">{tx.logicalDate}</td>
                <td className="px-3 py-2 text-sm max-w-xs truncate">{tx.note}</td>
                {showPayee && <td className="px-3 py-2 text-sm">{tx.payeeName}</td>}
                <td className="px-3 py-2 text-sm">{tx.category}</td>
                <td className="px-3 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      tx.method === "Paid"
                        ? "bg-red-500/20 text-red-400"
                        : tx.method === "Accrued"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    {tx.method}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-2 text-sm font-mono ${tx.usdEquivalent > 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}
                >
                  ${Math.abs(tx.usdEquivalent).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
