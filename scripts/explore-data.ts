const NOTION_API_KEY = "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";
const NOTION_VERSION = "2022-06-28";

const databases = {
  people: "99d87f1967d947b39d47e60ff0ac0cb1",
  sensitiveData: "2f026381fbfd80cb802deadfad9f7e04",
  transactions: "2ef26381fbfd805ead6fe0ff01d6c1ac",
  payees: "07bd2f9421e242f7b7f59bdc8491b3ec",
  vacations: "30b26381fbfd80d18be7d9709ee2f896",
};

const headers = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
};

async function fetchDB(id: string) {
  return fetch(`https://api.notion.com/v1/databases/${id}`, { headers }).then((r) => r.json());
}

async function queryDB(id: string, pageSize = 3) {
  return fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ page_size: pageSize }),
  }).then((r) => r.json());
}

// biome-ignore lint: exploration script
function extractValue(prop: any): string {
  switch (prop.type) {
    case "title":
      return prop.title?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
    case "rich_text":
      return prop.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";
    case "number":
      return String(prop.number ?? "");
    case "select":
      return prop.select?.name ?? "";
    case "multi_select":
      return prop.multi_select?.map((i: { name: string }) => i.name).join(", ") ?? "";
    case "date":
      return prop.date ? `${prop.date.start}${prop.date.end ? ` -> ${prop.date.end}` : ""}` : "";
    case "checkbox":
      return String(prop.checkbox ?? false);
    case "relation":
      return prop.relation?.map((i: { id: string }) => i.id).join(", ") ?? "";
    case "status":
      return prop.status?.name ?? "";
    case "formula": {
      if (prop.formula.type === "number") return String(prop.formula.number ?? "");
      if (prop.formula.type === "string") return prop.formula.string ?? "";
      if (prop.formula.type === "boolean") return String(prop.formula.boolean ?? "");
      if (prop.formula.type === "date") return prop.formula.date?.start ?? "";
      return `[formula:${prop.formula.type}]`;
    }
    case "rollup": {
      if (prop.rollup.type === "number") return String(prop.rollup.number ?? "");
      if (prop.rollup.type === "array") return `[array:${prop.rollup.array?.length ?? 0} items]`;
      return `[rollup:${prop.rollup.type}]`;
    }
    case "created_time":
      return String(prop.created_time ?? "");
    case "last_edited_time":
      return String(prop.last_edited_time ?? "");
    case "people":
      return prop.people?.map((p: { name?: string; id: string }) => p.name ?? p.id).join(", ") ?? "";
    default:
      return `[${prop.type}]`;
  }
}

// biome-ignore lint: exploration script
async function exploreDatabase(name: string, id: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`DATABASE: ${name} (${id})`);
  console.log("=".repeat(60));

  const db: any = await fetchDB(id);
  const properties = db.properties ?? {};

  console.log("\nProperties:");
  for (const [propName, prop] of Object.entries(properties) as [string, any][]) {
    let extra = "";
    if (prop.type === "select" || prop.type === "status") {
      const options = prop[prop.type]?.options;
      if (options) extra = ` [${options.map((o: { name: string }) => o.name).join(", ")}]`;
    }
    if (prop.type === "relation") {
      extra = ` -> ${prop.relation?.database_id}`;
    }
    if (prop.type === "formula") {
      extra = ` (${prop.formula?.expression ?? "?"})`;
    }
    console.log(`  - ${propName}: ${prop.type}${extra}`);
  }

  const response: any = await queryDB(id, 3);
  console.log(`\nSample entries (${response.results?.length ?? 0}):`);

  for (const page of response.results ?? []) {
    console.log(`\n  Page ID: ${page.id}`);
    for (const [propName, prop] of Object.entries(page.properties ?? {}) as [string, any][]) {
      const val = extractValue(prop);
      if (val) console.log(`    ${propName}: ${val}`);
    }
  }
}

async function main() {
  for (const [name, id] of Object.entries(databases)) {
    await exploreDatabase(name, id);
  }
}

main().catch(console.error);
