<script lang="ts">
  import { page } from "$app/stores";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";

  $: token = $page.url.searchParams.get("token") ?? "";
  let password = "";
  let confirmPassword = "";
  let error = "";
  let success = false;
  let loading = false;

  async function handleSubmit() {
    error = "";

    if (password !== confirmPassword) {
      error = "Passwords do not match";
      return;
    }

    loading = true;
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        error = payload?.message ?? "Something went wrong. Please try again.";
        return;
      }
      success = true;
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center">
  {#if !token}
    <div class="text-(--text-muted)">Invalid reset link.</div>
  {:else if success}
    <div class="w-full max-w-sm space-y-4 rounded-xl border border-(--border) bg-(--bg-card) p-8 text-center">
      <p class="text-sm text-green-500">Password reset successfully.</p>
      <a href="/login" class="text-sm text-(--accent) hover:underline">Back to sign in</a>
    </div>
  {:else}
    <div class="w-full max-w-sm space-y-6 rounded-xl border border-(--border) bg-(--bg-card) p-8">
      <div class="space-y-1">
        <h1 class="text-xl font-bold text-(--accent)">Atma Finances</h1>
        <p class="text-sm text-(--text-muted)">Set new password</p>
      </div>

      {#if error}
        <p class="text-sm text-red-500">{error}</p>
      {/if}

      <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
        <Input bind:value={password} type="password" placeholder="New password" required minlength="8" />
        <Input bind:value={confirmPassword} type="password" placeholder="Confirm password" required minlength="8" />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "Reset Password"}</Button>
      </form>
    </div>
  {/if}
</div>
