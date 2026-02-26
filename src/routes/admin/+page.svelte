<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Input from "$lib/components/ui/input.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";

  export let data: { data: { admins: { id: string; email: string; name: string | null }[]; superAdminEmails: string[] } };
  const payload = data.data;

  let email = "";
  let loading = false;
  let error = "";

  async function addAdmin(event: Event) {
    event.preventDefault();
    if (!email.trim()) return;

    loading = true;
    error = "";

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to add admin");
      }
      email = "";
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message || "Failed to add admin";
    } finally {
      loading = false;
    }
  }

  async function removeAdmin(adminEmail: string) {
    loading = true;
    error = "";

    try {
      const res = await fetch("/api/admin", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to remove admin");
      }
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message || "Failed to remove admin";
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Admin Management</h1>
  <Card className="border border-(--border)">
    <CardHeader>
      <CardTitle>Current Admins</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-(--border) hover:bg-transparent">
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each payload.admins as admin (admin.id)}
            <TableRow>
              <TableCell className="px-4 py-2 text-sm">
                {admin.email}
                {#if payload.superAdminEmails.includes(admin.email)}
                  <span class="ml-2 text-xs text-(--accent)">(Super Admin)</span>
                {/if}
              </TableCell>
              <TableCell className="px-4 py-2 text-sm text-(--text-muted)">{admin.name ?? "—"}</TableCell>
              <TableCell className="px-4 py-2 text-right">
                {#if !payload.superAdminEmails.includes(admin.email)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-(--red)"
                    on:click={() => removeAdmin(admin.email)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                {/if}
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>

      <form class="mt-4 flex items-end gap-3" on:submit={addAdmin}>
        <div class="flex-1">
          <label for="admin-email" class="mb-1 block text-xs font-medium text-(--text-muted)">
            Add admin by email
          </label>
          <Input id="admin-email" bind:value={email} type="email" placeholder="user@example.com" />
        </div>
        <Button type="submit" disabled={loading || !email.trim()}>Add</Button>
      </form>

      {#if error}
        <p class="mt-3 text-sm text-(--red)">{error}</p>
      {/if}
    </CardContent>
  </Card>
</div>
