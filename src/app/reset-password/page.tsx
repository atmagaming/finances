"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error);
      else setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-muted)]">Invalid reset link.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 w-full max-w-sm space-y-4 text-center">
          <p className="text-sm text-green-500">Password reset successfully.</p>
          <a href="/login" className="text-sm text-[var(--accent)] hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--accent)]">Atma Finances</h1>
          <p className="text-sm text-[var(--text-muted)]">Set new password</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
