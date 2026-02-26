/**
 * Migration script: Notion → Turso
 *
 * Fetches people (Person + SensitiveData) and transactions from Notion
 * and inserts them into the Turso (LibSQL) database via Prisma.
 *
 * Usage:
 *   bun run --env-file=.env.local scripts/migrate-notion-to-turso.ts
 *
 * Options:
 *   --dry-run   Print what would be inserted without writing to DB
 */

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client.js";
import { Client as NotionClient } from "@notionhq/client";

const isDryRun = process.argv.includes("--dry-run");

// --- Env ---

const NOTION_API_KEY = process.env.NOTION_API_KEY ?? "";
const NOTION_PEOPLE_DB_ID = process.env.NOTION_PEOPLE_DB_ID ?? "";
const NOTION_SENSITIVE_DATA_DB_ID = process.env.NOTION_SENSITIVE_DATA_DB_ID ?? "";
const NOTION_PAYEES_DB_ID = process.env.NOTION_PAYEES_DB_ID ?? "";
const NOTION_TRANSACTIONS_DB_ID = process.env.NOTION_TRANSACTIONS_DB_ID ?? "";
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY is required");

// --- Prisma ---

const adapter = new PrismaLibSql({
  url: TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: TURSO_AUTH_TOKEN ?? undefined,
});
const prisma = new PrismaClient({ adapter });

// --- Notion helpers ---

const notion = new NotionClient({ auth: NOTION_API_KEY });

async function queryAll(databaseId: string): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      start_cursor: cursor,
    });
    results.push(...(response.results as Record<string, unknown>[]));
    cursor = response.has_more && response.next_cursor ? response.next_cursor : undefined;
  } while (cursor);
  return results;
}

function titleProp(page: Record<string, unknown>, key: string): string {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; title?: { plain_text: string }[] } | undefined;
  if (prop?.type === "title" && Array.isArray(prop.title)) return prop.title.map((t) => t.plain_text).join("");
  return "";
}

function numberProp(page: Record<string, unknown>, key: string): number {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; number?: number } | undefined;
  if (prop?.type === "number") return prop.number ?? 0;
  return 0;
}

function selectProp(page: Record<string, unknown>, key: string): string {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; select?: { name: string } } | undefined;
  if (prop?.type === "select") return prop.select?.name ?? "";
  return "";
}

function richTextProp(page: Record<string, unknown>, key: string): string {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; rich_text?: { plain_text: string }[] } | undefined;
  if (prop?.type === "rich_text" && Array.isArray(prop.rich_text)) return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

function dateProp(page: Record<string, unknown>, key: string): { start: string | null; end: string | null } {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; date?: { start?: string; end?: string } } | undefined;
  if (prop?.type === "date") return { start: prop.date?.start ?? null, end: prop.date?.end ?? null };
  return { start: null, end: null };
}

function relationProp(page: Record<string, unknown>, key: string): string[] {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; relation?: { id: string }[] } | undefined;
  if (prop?.type === "relation" && Array.isArray(prop.relation)) return prop.relation.map((r) => r.id);
  return [];
}

function formulaStr(page: Record<string, unknown>, key: string): string {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; formula?: { type: string; string?: string } } | undefined;
  if (prop?.type === "formula" && prop.formula?.type === "string") return prop.formula.string ?? "";
  return "";
}

function formulaNum(page: Record<string, unknown>, key: string): number {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; formula?: { type: string; number?: number } } | undefined;
  if (prop?.type === "formula" && prop.formula?.type === "number") return prop.formula.number ?? 0;
  return 0;
}

function peopleEmail(page: Record<string, unknown>, key: string): string {
  const props = (page.properties as Record<string, unknown>) ?? {};
  const prop = props[key] as { type: string; people?: { person?: { email?: string } }[] } | undefined;
  if (prop?.type === "people" && Array.isArray(prop.people) && prop.people.length > 0) {
    return prop.people[0]?.person?.email ?? "";
  }
  return "";
}

// --- Migration ---

async function migrate() {
  console.log(`${isDryRun ? "[DRY RUN] " : ""}Fetching data from Notion...`);

  const [notionPeople, notionSensitiveData, notionPayees, notionTransactions] = await Promise.all([
    queryAll(NOTION_PEOPLE_DB_ID),
    queryAll(NOTION_SENSITIVE_DATA_DB_ID),
    queryAll(NOTION_PAYEES_DB_ID),
    queryAll(NOTION_TRANSACTIONS_DB_ID),
  ]);

  console.log(`Fetched: ${notionPeople.length} people, ${notionSensitiveData.length} sensitive data entries, ${notionPayees.length} payees, ${notionTransactions.length} transactions`);

  // Build sensitive data map: notionPersonId → SensitiveData record
  const sensitiveByPersonId = new Map<string, Record<string, unknown>>();
  for (const sd of notionSensitiveData) {
    const personIds = relationProp(sd, "Person");
    if (personIds.length > 0) sensitiveByPersonId.set(personIds[0] as string, sd);
  }

  // Build payee → personId map (Notion IDs)
  const payeePersonMap = new Map<string, string>(); // notionPayeeId → notionPersonId
  const payeeNameMap = new Map<string, string>(); // notionPayeeId → payeeName
  for (const payee of notionPayees) {
    const id = payee.id as string;
    const name = titleProp(payee, "Name");
    payeeNameMap.set(id, name);
    const personIds = relationProp(payee, "Person");
    if (personIds.length > 0) payeePersonMap.set(id, personIds[0] as string);
  }

  // Build notion person ID → prisma person ID mapping (created during insert)
  const notionToPrismaPersonId = new Map<string, string>();

  // --- Insert People ---
  console.log("\nInserting people...");

  for (const person of notionPeople) {
    const notionPersonId = person.id as string;
    const name = titleProp(person, "Name");
    const notionEmail = peopleEmail(person, "Notion Person");

    const sd = sensitiveByPersonId.get(notionPersonId);
    const weeklySchedule = sd ? richTextProp(sd, "Schedule (hours)") || "4,4,4,4,4,0,0" : "4,4,4,4,4,0,0";
    const hourlyRatePaid = sd ? numberProp(sd, "Hourly Paid") : 0;
    const hourlyRateAccrued = sd ? numberProp(sd, "Hourly Accrued") : 0;

    // Derive status changes from SensitiveData start/end dates
    const startDate = sd ? dateProp(sd, "Start Date").start : null;
    const endDate = sd ? dateProp(sd, "End Date").start : null;

    const statusChanges: { date: string; status: string }[] = [];
    if (startDate) statusChanges.push({ date: startDate, status: "working" });
    if (endDate) statusChanges.push({ date: endDate, status: "terminated" });

    console.log(`  Person: ${name} (${notionPersonId})`);

    if (!isDryRun) {
      const created = await prisma.person.create({
        data: {
          name,
          email: notionEmail,
          notionPersonPageId: notionPersonId,
          weeklySchedule,
          hourlyRatePaid,
          hourlyRateAccrued,
          statusChanges: {
            create: statusChanges,
          },
        },
      });
      notionToPrismaPersonId.set(notionPersonId, created.id);
      console.log(`    → Prisma ID: ${created.id}`);
    } else {
      // In dry run, use a placeholder ID
      notionToPrismaPersonId.set(notionPersonId, `dry-run-${notionPersonId}`);
    }
  }

  // --- Insert Transactions ---
  console.log("\nInserting transactions...");

  let inserted = 0;
  let skipped = 0;

  for (const tx of notionTransactions) {
    const logicalDate = dateProp(tx, "Logical Date").start;
    if (!logicalDate) {
      console.log(`  Skipping transaction ${tx.id}: no logical date`);
      skipped++;
      continue;
    }

    const notionPayeeId = relationProp(tx, "From / To")[0] ?? "";
    const notionPersonId = notionPayeeId ? payeePersonMap.get(notionPayeeId) : undefined;
    const prismaPersonId = notionPersonId ? notionToPrismaPersonId.get(notionPersonId) : undefined;
    const payeeName = notionPayeeId ? (payeeNameMap.get(notionPayeeId) ?? "Unknown") : "";

    const amount = numberProp(tx, "Amount");
    const usdEquivalent = formulaNum(tx, "USD Equivalent");
    const currency = selectProp(tx, "Currency") || "USD";
    const method = formulaStr(tx, "Method") || "Paid";
    const category = selectProp(tx, "Category");
    const note = titleProp(tx, "Note");
    const factualDate = dateProp(tx, "Factual Date").start;

    console.log(`  Transaction: ${note || "(no note)"} | ${logicalDate} | ${method} | $${Math.abs(usdEquivalent).toFixed(2)} → ${prismaPersonId ? "person" : payeeName || "unknown"}`);

    if (!isDryRun) {
      await prisma.transaction.create({
        data: {
          logicalDate,
          factualDate: factualDate ?? undefined,
          amount,
          usdEquivalent,
          currency,
          method,
          category,
          note,
          personId: prismaPersonId ?? undefined,
          payeeName: prismaPersonId ? "" : payeeName,
        },
      });
    }

    inserted++;
  }

  console.log(`\nDone! Inserted ${notionPeople.length} people, ${inserted} transactions (${skipped} skipped).`);
  if (isDryRun) console.log("(DRY RUN - nothing was written to the database)");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
