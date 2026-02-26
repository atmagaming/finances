<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { Person } from "$lib/types";
  import PeopleGrid from "$lib/components/PeopleGrid.svelte";
  import PeopleTable from "$lib/components/PeopleTable.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";

  export let data: {
    people: Person[];
    canViewPersonalData: boolean;
    canEditPeople: boolean;
  };

  const ACTIVE_STATUSES = new Set(["working", "vacation", "sick_leave"]);

  function isActive(person: Person): boolean {
    const sorted = person.statusChanges.toSorted((a, b) => a.date.localeCompare(b.date));
    const latest = sorted.at(-1);
    return latest !== undefined && ACTIVE_STATUSES.has(latest.status);
  }

  $: activePeople = data.people.filter(isActive);
  $: inactivePeople = data.people.filter((p) => !isActive(p));

  let activeTab: "active" | "inactive" = "active";
  $: displayedPeople = activeTab === "active" ? activePeople : inactivePeople;

  let showAddForm = false;
  let newPersonName = "";
  let addingPerson = false;

  async function addPerson() {
    if (!newPersonName.trim()) return;
    addingPerson = true;
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newPersonName.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.message ?? "Failed to add person");
        return;
      }
      newPersonName = "";
      showAddForm = false;
      await invalidateAll();
    } finally {
      addingPerson = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">
        {data.canViewPersonalData ? "HR — People" : "Team"}
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {data.canViewPersonalData
          ? "Full team directory with contact info and HR data."
          : "Active team members."}
      </p>
    </div>
    {#if data.canEditPeople}
      <Button onclick={() => (showAddForm = !showAddForm)}>Add Person</Button>
    {/if}
  </div>

  {#if showAddForm && data.canEditPeople}
    <div class="flex items-end gap-3 rounded-lg border border-border bg-card p-4">
      <div class="flex-1">
        <label class="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
        <Input bind:value={newPersonName} placeholder="Jane Smith" />
      </div>
      <Button onclick={addPerson} disabled={addingPerson || !newPersonName.trim()}>
        {addingPerson ? "Adding…" : "Add"}
      </Button>
      <Button variant="ghost" onclick={() => (showAddForm = false)}>Cancel</Button>
    </div>
  {/if}

  {#if data.canViewPersonalData}
    <div class="flex gap-2 border-b border-border">
      <button
        class={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onclick={() => (activeTab = "active")}
      >
        Active ({activePeople.length})
      </button>
      <button
        class={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "inactive" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        onclick={() => (activeTab = "inactive")}
      >
        Inactive / Candidates ({inactivePeople.length})
      </button>
    </div>

    <div class="overflow-x-auto rounded-lg border border-border bg-card">
      <PeopleTable people={displayedPeople} canEditPeople={data.canEditPeople} />
    </div>
  {:else}
    <PeopleGrid people={activePeople} />
  {/if}
</div>
