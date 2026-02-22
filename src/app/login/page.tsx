import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--accent)]">Atma Finances</h1>
          <p className="text-sm text-[var(--text-muted)]">Sign in to access the dashboard</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("notion", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Sign in with Notion
          </button>
        </form>
      </div>
    </div>
  );
}
