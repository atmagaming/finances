<script setup lang="ts">
const { user } = useUserSession();

if (!user.value?.isSuperAdmin) await navigateTo("/");

const { data, refresh } = await useFetch("/api/admin");

const email = ref("");
const loading = ref(false);
const error = ref("");

async function addAdmin(event: Event) {
  event.preventDefault();
  if (!email.value.trim()) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await $fetch("/api/admin", {
      method: "POST",
      body: { email: email.value.trim() },
    });
    if (response) {
      email.value = "";
      await refresh();
    }
  } catch (e) {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? "Failed to add admin";
  } finally {
    loading.value = false;
  }
}

async function removeAdmin(adminEmail: string) {
  loading.value = true;
  error.value = "";

  try {
    await $fetch("/api/admin", {
      method: "DELETE",
      body: { email: adminEmail },
    });
    await refresh();
  } catch (e) {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? "Failed to remove admin";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Admin Management</h1>
    <div v-if="data" class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h2 class="mb-4 text-lg font-semibold">Current Admins</h2>

      <div class="space-y-4">
        <table class="w-full">
          <thead>
            <tr class="border-b border-[var(--border)]">
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Email
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Name
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="admin in data.admins"
              :key="admin.id"
              class="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <td class="px-4 py-2 text-sm">
                {{ admin.email }}
                <span v-if="data.superAdminEmails.includes(admin.email)" class="ml-2 text-xs text-[var(--accent)]">
                  (Super Admin)
                </span>
              </td>
              <td class="px-4 py-2 text-sm text-[var(--text-muted)]">{{ admin.name ?? "—" }}</td>
              <td class="px-4 py-2 text-right">
                <button
                  v-if="!data.superAdminEmails.includes(admin.email)"
                  type="button"
                  :disabled="loading"
                  class="rounded-md px-3 py-1 text-sm text-[var(--red)] transition-colors hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
                  @click="removeAdmin(admin.email)"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <form class="flex gap-3 items-end" @submit.prevent="addAdmin">
          <div class="flex-1">
            <label for="admin-email" class="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Add admin by email
            </label>
            <input
              id="admin-email"
              v-model="email"
              type="email"
              placeholder="user@example.com"
              class="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            :disabled="loading || !email.trim()"
            class="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        <p v-if="error" class="text-sm text-[var(--red)]">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
