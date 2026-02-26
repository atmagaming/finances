<script lang="ts">
  import type { Person } from "$lib/types";

  export let people: Pick<Person, "id" | "name" | "nickname" | "image" | "roles">[] = [];
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
  {#each people as person (person.id)}
    <div class="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm">
      {#if person.image}
        <img
          src={person.image}
          alt={person.nickname || person.name}
          class="size-16 rounded-full object-cover"
          referrerpolicy="no-referrer"
        />
      {:else}
        <div class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {(person.nickname || person.name)[0]?.toUpperCase() ?? "?"}
        </div>
      {/if}
      <div>
        <p class="text-sm font-semibold text-foreground">{person.nickname || person.name}</p>
        {#if person.roles.length > 0}
          <div class="mt-1 flex flex-wrap justify-center gap-1">
            {#each person.roles as role (role.id)}
              <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{role.name}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>
