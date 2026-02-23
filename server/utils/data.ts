import type { Payee, Person, SensitiveData, Transaction, TransactionMethod, Vacation } from "~/types";

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

async function fetchPeople(): Promise<Person[]> {
  const records = await findAll(peopleTable);
  return records.map((record) => {
    const props = record.properties();
    return {
      id: record.id,
      name: props.Name ?? "",
      status: formulaStr(props.Status),
      sensitiveDataIds: relationIds(props["Sensitive Data"]),
      notionEmail: peopleEmail(props["Notion Person"]),
    };
  });
}

async function fetchSensitiveData(): Promise<SensitiveData[]> {
  const records = await findAll(sensitiveDataTable);
  return records.map((record) => {
    const props = record.properties();
    const scheduleStr = props["Schedule (hours)"] ?? "";
    const schedule = scheduleStr ? scheduleStr.split(",").map((s) => Number(s.trim()) || 0) : [];
    return {
      id: record.id,
      name: props.Name ?? "",
      personId: relationIds(props.Person)[0] ?? "",
      hourlyPaid: props["Hourly Paid"] ?? 0,
      hourlyInvested: props["Hourly Accrued"] ?? 0,
      schedule,
      hoursPerWeek: schedule.reduce((a, b) => a + b, 0),
      monthlyPaid: formulaNum(props["Monthly Paid"]),
      monthlyInvested: formulaNum(props["Monthly Accrued"]),
      monthlyTotal: formulaNum(props["Monthly Total"]),
      startDate: props["Start Date"]?.start ?? null,
      endDate: props["End Date"]?.start ?? null,
      status: formulaStr(props.Status),
    };
  });
}

async function fetchPayees(): Promise<Payee[]> {
  const records = await findAll(payeesTable);
  return records.map((record) => {
    const props = record.properties();
    return {
      id: record.id,
      name: props.Name ?? "",
      personId: relationIds(props.Person)[0] ?? null,
      type: formulaStr(props.Type),
      accrued: formulaNum(props.Accrued),
      invested: formulaNum(props.Invested),
    };
  });
}

async function fetchTransactions(): Promise<Transaction[]> {
  const records = await findAll(transactionsTable);
  const payees = await getCachedPayees();
  const payeeMap = new Map(payees.map((p) => [p.id, p]));

  return records.map((record) => {
    const props = record.properties();
    const payeeId = relationIds(props["From / To"])[0] ?? "";
    const payee = payeeMap.get(payeeId);
    return {
      id: record.id,
      note: props.Note ?? "",
      amount: props.Amount ?? 0,
      usdEquivalent: formulaNum(props["USD Equivalent"]),
      currency: props.Currency ?? "",
      method: formulaStr(props.Method) as TransactionMethod,
      category: props.Category ?? "",
      logicalDate: props["Logical Date"]?.start ?? "",
      factualDate: props["Factual Date"]?.start ?? null,
      payeeId,
      payeeName: payee?.name ?? "Unknown",
    };
  });
}

async function fetchVacations(): Promise<Vacation[]> {
  const records = await findAll(vacationsTable);
  return records.map((record) => {
    const props = record.properties();
    return {
      id: record.id,
      personId: relationIds(props.Person)[0] ?? "",
      type: props.Type ?? "",
      startDate: props.Dates?.start ?? "",
      endDate: props.Dates?.end ?? null,
    };
  });
}

export function getCachedPeople() {
  return cached("people", fetchPeople);
}
export function getCachedSensitiveData() {
  return cached("sensitive-data", fetchSensitiveData);
}
export function getCachedPayees() {
  return cached("payees", fetchPayees);
}
export function getCachedTransactions() {
  return cached("transactions", fetchTransactions);
}
export function getCachedVacations() {
  return cached("vacations", fetchVacations);
}

export interface AllData {
  people: Person[];
  sensitiveData: SensitiveData[];
  transactions: Transaction[];
  payees: Payee[];
  vacations: Vacation[];
}

export async function getAllData(): Promise<AllData> {
  const [people, sensitiveData, transactions, payees, vacations] = await Promise.all([
    getCachedPeople(),
    getCachedSensitiveData(),
    getCachedTransactions(),
    getCachedPayees(),
    getCachedVacations(),
  ]);
  return { people, sensitiveData, transactions, payees, vacations };
}
