const NOTION_VERSION = "2022-06-28";
const API_KEY = process.env.NOTION_API_KEY ?? "";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
};

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
}

type NotionProperty = { type: string; [key: string]: unknown };

export async function queryAllPages(databaseId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const response = (await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }).then((r) => r.json())) as {
      results: Array<{ id: string; properties: Record<string, NotionProperty> }>;
      has_more: boolean;
      next_cursor: string | null;
    };

    for (const page of response.results) {
      pages.push({ id: page.id, properties: page.properties });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

export function text(prop: NotionProperty | undefined): string {
  if (!prop) return "";
  if (prop.type === "title") {
    const items = prop.title as Array<{ plain_text: string }> | undefined;
    return items?.map((t) => t.plain_text).join("") ?? "";
  }
  if (prop.type === "rich_text") {
    const items = prop.rich_text as Array<{ plain_text: string }> | undefined;
    return items?.map((t) => t.plain_text).join("") ?? "";
  }
  return "";
}

export function num(prop: NotionProperty | undefined): number {
  if (!prop || prop.type !== "number") return 0;
  return (prop.number as number | null) ?? 0;
}

export function select(prop: NotionProperty | undefined): string {
  if (!prop) return "";
  if (prop.type === "select") return (prop.select as { name: string } | null)?.name ?? "";
  if (prop.type === "status") return (prop.status as { name: string } | null)?.name ?? "";
  return "";
}

export function date(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== "date") return null;
  const d = prop.date as { start: string; end?: string } | null;
  return d?.start ?? null;
}

export function dateEnd(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== "date") return null;
  const d = prop.date as { start: string; end?: string } | null;
  return d?.end ?? null;
}

export function relation(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== "relation") return [];
  const items = prop.relation as Array<{ id: string }> | undefined;
  return items?.map((i) => i.id) ?? [];
}

export function formulaString(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== "formula") return "";
  const f = prop.formula as { type: string; string?: string; number?: number };
  if (f.type === "string") return f.string ?? "";
  if (f.type === "number") return String(f.number ?? "");
  return "";
}

export function formulaNumber(prop: NotionProperty | undefined): number {
  if (!prop || prop.type !== "formula") return 0;
  const f = prop.formula as { type: string; number?: number };
  return f.number ?? 0;
}

export function people(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== "people") return "";
  const items = prop.people as Array<{ person?: { email?: string } }> | undefined;
  return items?.[0]?.person?.email ?? "";
}
