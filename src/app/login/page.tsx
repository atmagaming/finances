"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type Mode = "login" | "register" | "forgot-password";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) setError("Invalid email or password");
        else window.location.href = "/";
      } else if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error);
        } else {
          const result = await signIn("credentials", { email, password, redirect: false });
          if (result?.error) setError("Registration succeeded but login failed. Please sign in.");
          else window.location.href = "/";
        }
      } else {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (response.ok) setSuccess("If that email exists, a reset link has been sent.");
        else setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password";

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #f8f9fb 50%, #fdf2f8 100%)" }}
    >
      <div
        className="rounded-2xl bg-[var(--bg-card)] p-8 w-full max-w-sm space-y-6"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      >
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--accent)]">Atma Finances</h1>
          <p className="text-sm text-[var(--text-muted)]">{title}</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          {mode !== "forgot-password" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "..." : title}
          </button>
        </form>

        {mode === "login" && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[var(--bg-card)] px-2 text-[var(--text-muted)]">or</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              Sign in with Google
            </button>
          </>
        )}

        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          {mode === "login" && (
            <>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="hover:text-[var(--accent)] transition-colors"
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => setMode("forgot-password")}
                className="hover:text-[var(--accent)] transition-colors"
              >
                Forgot password?
              </button>
            </>
          )}
          {mode !== "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className="hover:text-[var(--accent)] transition-colors"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
