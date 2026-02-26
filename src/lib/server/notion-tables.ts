import { type NotionPropertySchema, NotionTable } from "@interactive-inc/notion-client";
import { Client } from "@notionhq/client";
import { env } from "$env/dynamic/private";

const client = new Client({ auth: env.NOTION_API_KEY });

export const peopleTable = new NotionTable({
  client,
  dataSourceId: env.NOTION_PEOPLE_DB_ID as string,
  properties: {
    Name: { type: "title" },
    Status: { type: "formula", formulaType: "string" },
    "Sensitive Data": { type: "relation" },
    "Notion Person": { type: "people" },
  } as const,
});

export const sensitiveDataTable = new NotionTable({
  client,
  dataSourceId: env.NOTION_SENSITIVE_DATA_DB_ID as string,
  properties: {
    Name: { type: "title" },
    Person: { type: "relation" },
    "Hourly Paid": { type: "number" },
    "Hourly Accrued": { type: "number" },
    "Schedule (hours)": { type: "rich_text" },
    "Monthly Paid": { type: "formula", formulaType: "number" },
    "Monthly Accrued": { type: "formula", formulaType: "number" },
    "Monthly Total": { type: "formula", formulaType: "number" },
    "Start Date": { type: "date" },
    "End Date": { type: "date" },
    Status: { type: "formula", formulaType: "string" },
  } as const,
});

export const payeesTable = new NotionTable({
  client,
  dataSourceId: env.NOTION_PAYEES_DB_ID as string,
  properties: {
    Name: { type: "title" },
    Person: { type: "relation" },
    Type: { type: "formula", formulaType: "string" },
    Accrued: { type: "formula", formulaType: "number" },
    Invested: { type: "formula", formulaType: "number" },
  } as const,
});

export const transactionsTable = new NotionTable({
  client,
  dataSourceId: env.NOTION_TRANSACTIONS_DB_ID as string,
  properties: {
    Note: { type: "title" },
    Amount: { type: "number" },
    "USD Equivalent": { type: "formula", formulaType: "number" },
    Currency: { type: "select", options: [] as string[] },
    Method: { type: "formula", formulaType: "string" },
    Category: { type: "select", options: [] as string[] },
    "Logical Date": { type: "date" },
    "Factual Date": { type: "date" },
    "From / To": { type: "relation" },
  } as const,
});

export const vacationsTable = new NotionTable({
  client,
  dataSourceId: env.NOTION_VACATIONS_DB_ID as string,
  properties: {
    Person: { type: "relation" },
    Type: { type: "select", options: [] as string[] },
    Dates: { type: "date" },
  } as const,
});

export async function findAll<T extends NotionPropertySchema>(notionTable: NotionTable<T>) {
  let result = await notionTable.findMany();
  const allRecords = [...result.records];
  while (result.hasMore && result.nextCursor) {
    result = await notionTable.findMany({ cursor: result.nextCursor });
    allRecords.push(...result.records);
  }
  return allRecords;
}

export function formulaStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "string" in value) return (value as { string: string }).string ?? "";
  return "";
}

export function formulaNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "number" in value) return (value as { number: number }).number ?? 0;
  return 0;
}

export function relationIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === "string") return value;
  return value.map((r: { id: string }) => r.id);
}

export function peopleEmail(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "";
  const first = value[0];
  if (typeof first?.person?.email === "string") return first.person.email;
  if (typeof first?.email === "string") return first.email;
  return "";
}
