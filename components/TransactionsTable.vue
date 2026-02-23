<script setup lang="ts">
import type { Transaction } from "~/types";

const props = defineProps<{
  transactions: Transaction[];
  highlightPayeeIds: string[];
  maskedPayeeIds: string[];
}>();

const methodFilter = ref("all");
const categoryFilter = ref("all");
const tooltip = ref<{ x: number; y: number } | null>(null);
let tooltipTimeout: ReturnType<typeof setTimeout> | undefined;

const highlightSet = computed(() => new Set(props.highlightPayeeIds));
const maskedSet = computed(() => new Set(props.maskedPayeeIds));

const categories = computed(() =>
  [...new Set(props.transactions.map((t) => t.category).filter(Boolean))].sort(),
);
const methods = ["Paid", "Accrued", "Invested"];

const filtered = computed(() => {
  let result = props.transactions;
  if (methodFilter.value !== "all") result = result.filter((t) => t.method === methodFilter.value);
  if (categoryFilter.value !== "all") result = result.filter((t) => t.category === categoryFilter.value);
  return result;
});

function formatDate(iso: string) {
  const parts = iso.split("-");
  const year = parts[0] ?? "";
  const month = parts[1] ?? "1";
  const day = parts[2] ?? "";
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" });
  return `${day} ${monthName} ${year.slice(2)}`;
}

function showTooltip(event: MouseEvent) {
  clearTimeout(tooltipTimeout);
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  tooltip.value = { x: rect.left + rect.width / 2, y: rect.top };
}

function hideTooltip() {
  tooltipTimeout = setTimeout(() => { tooltip.value = null; }, 50);
}

const headerClass = "px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]";
</script>

<template>
  <div class="rounded-xl bg-[var(--bg-card)]" style="box-shadow: var(--shadow)">
    <div class="flex gap-4 border-b border-[var(--border)] p-4">
      <select
        v-model="methodFilter"
        class="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)]"
      >
        <option value="all">All Methods</option>
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <select
        v-model="categoryFilter"
        class="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)]"
      >
        <option value="all">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <span class="ml-auto self-center text-sm text-[var(--text-muted)]">{{ filtered.length }} transactions</span>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[var(--border)]">
            <th :class="headerClass">Date</th>
            <th :class="headerClass">Description</th>
            <th :class="headerClass">Payee</th>
            <th :class="headerClass">Category</th>
            <th :class="headerClass">Method</th>
            <th :class="headerClass">USD</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tx in filtered"
            :key="tx.id"
            :class="[
              'border-b border-[var(--border)] transition-colors',
              highlightSet.has(tx.payeeId) ? '' : 'hover:bg-[var(--bg-card-hover)]',
            ]"
            :style="
              highlightSet.has(tx.payeeId)
                ? { background: 'var(--accent-light)' }
                : maskedSet.has(tx.payeeId)
                  ? { background: 'var(--bg-card-hover)' }
                  : undefined
            "
          >
            <td class="whitespace-nowrap px-3 py-2.5 text-sm">{{ formatDate(tx.logicalDate) }}</td>
            <td
              :class="['max-w-xs truncate px-3 py-2.5 text-sm', maskedSet.has(tx.payeeId) ? 'text-[var(--text-muted)]' : '']"
            >
              {{ tx.note }}
            </td>
            <td
              :class="['px-3 py-2.5 text-sm', maskedSet.has(tx.payeeId) ? 'text-[var(--text-muted)]' : '']"
            >
              {{ tx.payeeName }}
            </td>
            <td :class="['px-3 py-2.5 text-sm', maskedSet.has(tx.payeeId) ? 'text-[var(--text-muted)]' : '']">
              {{ tx.category }}
            </td>
            <td class="px-3 py-2.5 text-sm">
              <span
                :class="[
                  'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                  tx.method === 'Paid'
                    ? 'bg-red-50 text-red-700'
                    : tx.method === 'Accrued'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-violet-50 text-violet-700',
                ]"
              >
                {{ tx.method }}
              </span>
            </td>
            <td
              :class="[
                'whitespace-nowrap px-3 py-2.5 text-sm font-mono',
                maskedSet.has(tx.payeeId) ? 'cursor-help text-[var(--text-muted)]' : tx.usdEquivalent > 0 ? 'text-[var(--green)]' : 'text-[var(--red)]',
              ]"
              @mouseenter="maskedSet.has(tx.payeeId) ? showTooltip($event) : undefined"
              @mouseleave="maskedSet.has(tx.payeeId) ? hideTooltip() : undefined"
            >
              <template v-if="maskedSet.has(tx.payeeId)">
                <img src="/question.png" alt="Hidden" width="16" height="16" class="inline opacity-40" />
              </template>
              <template v-else>${{ Math.abs(tx.usdEquivalent).toLocaleString() }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="tooltip"
      class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-gray-800 px-2.5 py-1.5 text-xs text-white shadow-lg"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y - 6}px` }"
    >
      Other team members' salaries are hidden
    </div>
  </Teleport>
</template>
