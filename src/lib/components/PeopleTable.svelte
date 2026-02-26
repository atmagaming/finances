<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { Person } from "$lib/types";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  } from "$lib/components/ui/table/index.js";

  export let people: Person[] = [];
  export let canEditPeople = false;

  const STATUS_LABELS: Record<string, string> = {
    working: "Working",
    vacation: "Vacation",
    sick_leave: "Sick Leave",
    inactive: "Inactive",
  };

  const STATUS_COLORS: Record<string, string> = {
    working: "bg-green-100 text-green-800",
    vacation: "bg-blue-100 text-blue-800",
    sick_leave: "bg-yellow-100 text-yellow-800",
    inactive: "bg-gray-100 text-gray-500",
  };

  function getLatestStatus(person: Person): string {
    const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
    return sorted.at(-1)?.status ?? "inactive";
  }

  let statusForms: Record<string, { status: string; date: string }> = {};

  function initStatusForm(personId: string) {
    if (!statusForms[personId]) {
      statusForms[personId] = {
        status: "working",
        date: new Date().toISOString().slice(0, 10),
      };
    }
  }

  let expandedStatusForm: string | null = null;

  async function addStatus(personId: string) {
    const form = statusForms[personId];
    if (!form) return;
    const res = await fetch(`/api/people/${personId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.message ?? "Failed to update status");
      return;
    }
    expandedStatusForm = null;
    await invalidateAll();
  }

  async function deletePerson(personId: string) {
    if (!confirm("Delete this person? This cannot be undone.")) return;
    const res = await fetch(`/api/people/${personId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.message ?? "Failed to delete");
      return;
    }
    await invalidateAll();
  }
</script>

<Table>
  <TableHeader>
    <TableRow class="border-b border-border hover:bg-transparent">
      <TableHead>Person</TableHead>
      <TableHead>Roles</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Schedule</TableHead>
      <TableHead>Rate (Paid)</TableHead>
      <TableHead>Rate (Accrued)</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Telegram</TableHead>
      <TableHead>Discord</TableHead>
      <TableHead>LinkedIn</TableHead>
      <TableHead>Notion</TableHead>
      {#if canEditPeople}
        <TableHead class="text-right">Actions</TableHead>
      {/if}
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each people as person (person.id)}
      {@const latestStatus = getLatestStatus(person)}
      <TableRow>
        <TableCell class="px-4 py-2">
          <div class="flex items-center gap-2">
            {#if person.image}
              <img
                src={person.image}
                alt={person.nickname || person.name}
                class="size-8 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
            {:else}
              <div class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(person.nickname || person.name)[0]?.toUpperCase() ?? "?"}
              </div>
            {/if}
            <div>
              <p class="text-sm font-medium text-foreground">{person.name}</p>
              {#if person.nickname}
                <p class="text-xs text-muted-foreground">{person.nickname}</p>
              {/if}
            </div>
          </div>
        </TableCell>
        <TableCell class="px-4 py-2">
          <div class="flex flex-wrap gap-1">
            {#each person.roles as role (role.id)}
              <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{role.name}</span>
            {/each}
          </div>
        </TableCell>
        <TableCell class="px-4 py-2">
          <span class={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[latestStatus] ?? "bg-gray-100 text-gray-500"}`}>
            {STATUS_LABELS[latestStatus] ?? latestStatus}
          </span>
        </TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.weeklySchedule}</TableCell>
        <TableCell class="px-4 py-2 text-sm">${person.hourlyRatePaid}/hr</TableCell>
        <TableCell class="px-4 py-2 text-sm">${person.hourlyRateAccrued}/hr</TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.email || "—"}</TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.telegramAccount || "—"}</TableCell>
        <TableCell class="px-4 py-2 text-sm text-muted-foreground">{person.discord || "—"}</TableCell>
        <TableCell class="px-4 py-2">
          {#if person.linkedin}
            <a href={person.linkedin} target="_blank" rel="noopener noreferrer" class="text-xs text-primary hover:underline">LinkedIn</a>
          {:else}
            <span class="text-sm text-muted-foreground">—</span>
          {/if}
        </TableCell>
        <TableCell class="px-4 py-2">
          {#if person.notionPersonPageId}
            <a
              href={`https://notion.so/${person.notionPersonPageId.replace(/-/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-primary hover:underline"
            >
              Notion
            </a>
          {:else}
            <span class="text-sm text-muted-foreground">—</span>
          {/if}
        </TableCell>
        {#if canEditPeople}
          <TableCell class="px-4 py-2 text-right">
            <div class="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onclick={() => {
                  initStatusForm(person.id);
                  expandedStatusForm = expandedStatusForm === person.id ? null : person.id;
                }}
              >
                Status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                onclick={() => deletePerson(person.id)}
              >
                Delete
              </Button>
            </div>
          </TableCell>
        {/if}
      </TableRow>
      {#if canEditPeople && expandedStatusForm === person.id}
        <TableRow class="bg-muted/30">
          <TableCell colspan={12} class="px-4 py-3">
            <div class="flex items-end gap-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-muted-foreground">New Status</label>
                <select
                  bind:value={statusForms[person.id].status}
                  class="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                >
                  <option value="working">Working</option>
                  <option value="inactive">Inactive</option>
                  <option value="vacation">Vacation</option>
                  <option value="sick_leave">Sick Leave</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
                <Input type="date" bind:value={statusForms[person.id].date} class="w-40" />
              </div>
              <Button size="sm" onclick={() => addStatus(person.id)}>Save</Button>
              <Button variant="ghost" size="sm" onclick={() => (expandedStatusForm = null)}>Cancel</Button>
            </div>
          </TableCell>
        </TableRow>
      {/if}
    {/each}
  </TableBody>
</Table>
