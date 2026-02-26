import { Client } from "@notionhq/client";
import { env } from "$env/dynamic/private";
import type { Person } from "$lib/types";

function getClient() {
  const auth = env.NOTION_API_KEY;
  if (!auth) throw new Error("NOTION_API_KEY is not set");
  return new Client({ auth });
}

export async function syncPersonNotionPage(person: Person, status: string): Promise<void> {
  if (!person.notionPersonPageId) return;

  const notion = getClient();

  if (status === "working") {
    await notion.pages.update({
      page_id: person.notionPersonPageId,
      icon: person.image ? { type: "external", external: { url: person.image } } : null,
      properties: {
        title: { title: [{ type: "text", text: { content: person.name } }] },
      },
    });
  } else if (status === "inactive") {
    const primaryRole = person.roles[0]?.name ?? "Team Member";
    await notion.pages.update({
      page_id: person.notionPersonPageId,
      icon: null,
      properties: {
        title: { title: [{ type: "text", text: { content: `${primaryRole} (TBH)` } }] },
      },
    });
  }
}
