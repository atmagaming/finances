const NOTION_API_KEY = "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";
const NOTION_VERSION = "2022-06-28";

const headers = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
};

// Get sensitive data with actual rates
const response = await fetch("https://api.notion.com/v1/databases/2f026381fbfd80cb802deadfad9f7e04/query", {
  method: "POST",
  headers,
  body: JSON.stringify({ page_size: 100 }),
}).then((r) => r.json()) as { results: Array<{ id: string; properties: Record<string, { type: string; [key: string]: unknown }> }> };

console.log("Sensitive Data entries with rates:\n");
for (const page of response.results) {
  const props = page.properties;
  const name = (props.Name as { title: Array<{ plain_text: string }> }).title?.map((t) => t.plain_text).join("") ?? "";
  const hourlyPaid = (props["Hourly Paid"] as { number: number | null }).number;
  const hourlyInvested = (props["Hourly Invested"] as { number: number | null }).number;
  const schedule = (props["Schedule (hours)"] as { rich_text: Array<{ plain_text: string }> }).rich_text?.map((t) => t.plain_text).join("") ?? "";
  const startDate = (props["Start Date"] as { date: { start: string } | null }).date?.start ?? "";
  const endDate = (props["End Date"] as { date: { start: string } | null }).date?.start ?? "";
  const status = props.Status as { formula: { string?: string } };

  if (hourlyPaid || hourlyInvested)
    console.log(`  ${name}: paid=$${hourlyPaid}/hr, invested=$${hourlyInvested}/hr, schedule=[${schedule}], start=${startDate}, end=${endDate || "active"}, status=${status.formula?.string ?? "?"}`);
}

// Get total transaction count
const txResponse = await fetch("https://api.notion.com/v1/databases/2ef26381fbfd805ead6fe0ff01d6c1ac/query", {
  method: "POST",
  headers,
  body: JSON.stringify({ page_size: 100 }),
}).then((r) => r.json()) as { results: unknown[]; has_more: boolean };

console.log(`\nTransactions: ${txResponse.results.length} (has_more: ${txResponse.has_more})`);
