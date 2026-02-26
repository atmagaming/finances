<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Card, CardHeader, CardContent, CardTitle } from "$lib/components/ui/card/index.js";
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table/index.js";

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
        const responsePayload = await res.json().catch(() => ({}));
        throw new Error(responsePayload?.message ?? "Failed to add admin");
      }
      email = "";
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message ?? "Failed to add admin";
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
        const responsePayload = await res.json().catch(() => ({}));
        throw new Error(responsePayload?.message ?? "Failed to remove admin");
      }
      await invalidateAll();
    } catch (e) {
      error = (e as Error).message ?? "Failed to remove admin";
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Admin Management</h1>
    <p class="mt-1 text-sm text-muted-foreground">Manage dashboard access and admin permissions.</p>
  </div>
  <Card>
    <CardHeader>
      <CardTitle>Current Admins</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow class="border-b border-border hover:bg-transparent">
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each payload.admins as admin (admin.id)}
            <TableRow>
              <TableCell class="px-4 py-2 text-sm">
                {admin.email}
                {#if payload.superAdminEmails.includes(admin.email)}
                  <span class="ml-2 text-xs text-primary">(Super Admin)</span>
                {/if}
              </TableCell>
              <TableCell class="px-4 py-2 text-sm text-muted-foreground">{admin.name ?? "—"}</TableCell>
              <TableCell class="px-4 py-2 text-right">
                {#if !payload.superAdminEmails.includes(admin.email)}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    onclick={() => removeAdmin(admin.email)}
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
          <label for="admin-email" class="mb-1 block text-xs font-medium text-muted-foreground">
            Add admin by email
          </label>
          <Input id="admin-email" bind:value={email} type="email" placeholder="user@example.com" />
        </div>
        <Button type="submit" disabled={loading || !email.trim()}>Add</Button>
      </form>

      {#if error}
        <p class="mt-3 text-sm text-destructive">{error}</p>
      {/if}
    </CardContent>
  </Card>
</div>
