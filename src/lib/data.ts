import { unstable_cache } from "next/cache";
import {
  date,
  dateEnd,
  formulaNumber,
  formulaString,
  num,
  people,
  queryAllPages,
  relation,
  select,
  text,
} from "./notion";
import type { Payee, Person, SensitiveData, Transaction, TransactionMethod, Vacation } from "./types";

const PEOPLE_DB = process.env.NOTION_PEOPLE_DB_ID ?? "";
const SENSITIVE_DB = process.env.NOTION_SENSITIVE_DATA_DB_ID ?? "";
const TRANSACTIONS_DB = process.env.NOTION_TRANSACTIONS_DB_ID ?? "";
const PAYEES_DB = process.env.NOTION_PAYEES_DB_ID ?? "";
const VACATIONS_DB = process.env.NOTION_VACATIONS_DB_ID ?? "";

async function fetchPeople(): Promise<Person[]> {
  const pages = await queryAllPages(PEOPLE_DB);
  return pages.map((p) => ({
    id: p.id,
    name: text(p.properties.Name),
    status: formulaString(p.properties.Status),
    sensitiveDataIds: relation(p.properties["Sensitive Data"]),
    notionEmail: people(p.properties["Notion Person"]),
  }));
}

async function fetchSensitiveData(): Promise<SensitiveData[]> {
  const pages = await queryAllPages(SENSITIVE_DB);
  return pages.map((p) => {
    const scheduleStr = text(p.properties["Schedule (hours)"]);
    const schedule = scheduleStr ? scheduleStr.split(",").map((s) => Number(s.trim()) || 0) : [];
    return {
      id: p.id,
      name: text(p.properties.Name),
      personId: relation(p.properties.Person)[0] ?? "",
      hourlyPaid: num(p.properties["Hourly Paid"]),
      hourlyInvested: num(p.properties["Hourly Invested"]),
      schedule,
      hoursPerWeek: schedule.reduce((a, b) => a + b, 0),
      startDate: date(p.properties["Start Date"]),
      endDate: date(p.properties["End Date"]),
      status: formulaString(p.properties.Status),
    };
  });
}

async function fetchTransactions(): Promise<Transaction[]> {
  const pages = await queryAllPages(TRANSACTIONS_DB);
  const payees = await getCachedPayees();
  const payeeMap = new Map(payees.map((p) => [p.id, p]));

  return pages.map((p) => {
    const payeeId = relation(p.properties["From / To"])[0] ?? "";
    const payee = payeeMap.get(payeeId);
    return {
      id: p.id,
      note: text(p.properties.Note),
      amount: num(p.properties.Amount),
      usdEquivalent: formulaNumber(p.properties["USD Equivalent"]),
      currency: select(p.properties.Currency),
      method: formulaString(p.properties.Method) as TransactionMethod,
      category: select(p.properties.Category),
      logicalDate: date(p.properties["Logical Date"]) ?? "",
      factualDate: date(p.properties["Factual Date"]),
      payeeId,
      payeeName: payee?.name ?? "Unknown",
    };
  });
}

async function fetchPayees(): Promise<Payee[]> {
  const pages = await queryAllPages(PAYEES_DB);
  return pages.map((p) => ({
    id: p.id,
    name: text(p.properties.Name),
    personId: relation(p.properties.Person)[0] ?? null,
    type: formulaString(p.properties.Type),
  }));
}

async function fetchVacations(): Promise<Vacation[]> {
  const pages = await queryAllPages(VACATIONS_DB);
  return pages.map((p) => ({
    id: p.id,
    personId: relation(p.properties.Person)[0] ?? "",
    type: select(p.properties.Type),
    startDate: date(p.properties.Dates) ?? "",
    endDate: dateEnd(p.properties.Dates),
  }));
}

const CACHE_TTL = 300; // 5 minutes

export const getCachedPeople = unstable_cache(fetchPeople, ["people"], { revalidate: CACHE_TTL });
export const getCachedSensitiveData = unstable_cache(fetchSensitiveData, ["sensitive-data"], { revalidate: CACHE_TTL });
export const getCachedTransactions = unstable_cache(fetchTransactions, ["transactions"], { revalidate: CACHE_TTL });
export const getCachedPayees = unstable_cache(fetchPayees, ["payees"], { revalidate: CACHE_TTL });
export const getCachedVacations = unstable_cache(fetchVacations, ["vacations"], { revalidate: CACHE_TTL });

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
