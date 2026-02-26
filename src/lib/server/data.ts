import type { Person, SensitiveData, Transaction, TransactionMethod } from "$lib/types";
import { prisma } from "$lib/server/prisma";

const CACHE_TTL = 300_000; // 5 minutes in ms

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

function countMondaysInMonth(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month, day).getDay() === 1) count++;
  }
  return count;
}

async function fetchPeople(): Promise<Person[]> {
  const records = await prisma.person.findMany({
    include: { statusChanges: true, documents: true, roles: true },
  });
  return records.map((r) => ({
    id: r.id,
    name: r.name,
    identification: r.identification,
    weeklySchedule: r.weeklySchedule,
    hourlyRatePaid: r.hourlyRatePaid,
    hourlyRateAccrued: r.hourlyRateAccrued,
    email: r.email,
    notionPersonPageId: r.notionPersonPageId,
    telegramAccount: r.telegramAccount,
    statusChanges: r.statusChanges.map((sc) => ({ id: sc.id, date: sc.date, status: sc.status })),
    documents: r.documents.map((d) => ({ id: d.id, name: d.name, url: d.url })),
    roles: r.roles.map((role) => ({ id: role.id, name: role.name, notionId: role.notionId })),
  }));
}

async function fetchTransactions(): Promise<Transaction[]> {
  const records = await prisma.transaction.findMany();
  return records.map((r) => ({
    id: r.id,
    note: r.note,
    amount: r.amount,
    usdEquivalent: r.usdEquivalent,
    currency: r.currency,
    method: r.method as TransactionMethod,
    category: r.category,
    logicalDate: r.logicalDate,
    factualDate: r.factualDate ?? null,
    personId: r.personId ?? null,
    payeeName: r.payeeName,
  }));
}

export function deriveSensitiveData(people: Person[]): SensitiveData[] {
  const now = new Date();
  const mondays = countMondaysInMonth(now.getFullYear(), now.getMonth());

  return people.map((person) => {
    const schedule = person.weeklySchedule.split(",").map((s) => Number(s.trim()) || 0);
    const hoursPerWeek = schedule.reduce((a, b) => a + b, 0);

    const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
    const workingChange = sorted.find((c) => c.status === "working");
    const terminatedChange = sorted.findLast((c) => c.status === "terminated");
    const latest = sorted.at(-1);
    const status = !latest || latest.status === "terminated" ? "Inactive" : "Active";

    const monthlyPaid = hoursPerWeek * person.hourlyRatePaid * mondays;
    const monthlyInvested = hoursPerWeek * person.hourlyRateAccrued * mondays;

    return {
      id: person.id,
      name: person.name,
      personId: person.id,
      hourlyPaid: person.hourlyRatePaid,
      hourlyInvested: person.hourlyRateAccrued,
      schedule,
      hoursPerWeek,
      monthlyPaid,
      monthlyInvested,
      monthlyTotal: monthlyPaid + monthlyInvested,
      startDate: workingChange?.date ?? null,
      endDate: terminatedChange?.date ?? null,
      status,
    };
  });
}

export function getCachedPeople() {
  return cached("people", fetchPeople);
}
export function getCachedTransactions() {
  return cached("transactions", fetchTransactions);
}

export interface AllData {
  people: Person[];
  sensitiveData: SensitiveData[];
  transactions: Transaction[];
}

export async function getAllData(): Promise<AllData> {
  const [people, transactions] = await Promise.all([getCachedPeople(), getCachedTransactions()]);
  const sensitiveData = deriveSensitiveData(people);
  return { people, sensitiveData, transactions };
}
