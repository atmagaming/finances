<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";

  type Mode = "login" | "register" | "forgot-password";

  let mode: Mode = "login";
  let email = "";
  let password = "";
  let name = "";
  let error = "";
  let success = "";
  let loading = false;

  $: title = mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password";

  async function handleSubmit() {
    error = "";
    success = "";
    loading = true;

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error();
        await invalidateAll();
        await goto("/");
      } else if (mode === "register") {
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!registerRes.ok) {
          const payload = await registerRes.json().catch(() => ({}));
          throw new Error(payload?.message || "Registration failed");
        }

        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!loginRes.ok) throw new Error("Invalid email or password");
        await invalidateAll();
        await goto("/");
      } else {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error();
        success = "If that email exists, a reset link has been sent.";
      }
    } catch (e) {
      if (mode === "login") error = "Invalid email or password";
      else if (mode === "register") error = (e as Error).message || "Registration failed";
      else error = "Something went wrong. Please try again.";
    } finally {
      loading = false;
    }
  }

  function switchMode(newMode: Mode) {
    mode = newMode;
    error = "";
    success = "";
  }
</script>

<div
  class="flex min-h-screen items-center justify-center"
  style="background: linear-gradient(135deg, #f0f4ff 0%, #f8f9fb 50%, #fdf2f8 100%)"
>
  <div
    class="w-full max-w-sm space-y-6 rounded-2xl bg-(--bg-card) p-8"
    style="box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08)"
  >
    <div class="space-y-1">
      <h1 class="text-xl font-bold text-(--accent)">Atma Finances</h1>
      <p class="text-sm text-(--text-muted)">{title}</p>
    </div>

    {#if error}
      <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    {/if}
    {#if success}
      <p class="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
    {/if}

    <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
      {#if mode === "register"}
        <Input bind:value={name} type="text" placeholder="Name" />
      {/if}
      <Input bind:value={email} type="email" placeholder="Email" required />
      {#if mode !== "forgot-password"}
        <Input bind:value={password} type="password" placeholder="Password" required minlength="8" />
      {/if}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : title}</Button>
    </form>

    {#if mode === "login"}
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-(--border)"></div>
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="bg-(--bg-card) px-2 text-(--text-muted)">or</span>
        </div>
      </div>
      <a
        href="/auth/google"
        class="block w-full rounded-lg border border-(--border) bg-(--bg) px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-(--bg-card-hover)"
      >
        Sign in with Google
      </a>
    {/if}

    <div class="flex justify-between text-xs text-(--text-muted)">
      {#if mode === "login"}
        <button type="button" class="transition-colors hover:text-(--accent)" on:click={() => switchMode("register")}>
          Create account
        </button>
        <button
          type="button"
          class="transition-colors hover:text-(--accent)"
          on:click={() => switchMode("forgot-password")}
        >
          Forgot password?
        </button>
      {:else}
        <button type="button" class="transition-colors hover:text-(--accent)" on:click={() => switchMode("login")}>
          Back to sign in
        </button>
      {/if}
    </div>

    <div class="border-t border-(--border) pt-4 text-center">
      <p class="text-xs text-(--text-muted)">Want to browse without signing in?</p>
      <a href="/" class="mt-1 inline-block text-sm font-medium text-(--accent) hover:underline">
        Continue as guest
      </a>
    </div>
  </div>
</div>
