"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LockKeyhole, Mail } from "lucide-react";

type ApiResponse =
  | {
      message: string;
      data?: {
        devOtp?: string;
      };
    }
  | {
      error: string;
    };

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json()) as ApiResponse;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Unable to send reset code");
      }

      setDevOtp("data" in body && body.data?.devOtp ? body.data.devOtp : null);
      setCodeSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to send reset code",
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          password,
        }),
      });
      const body = (await response.json()) as ApiResponse;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Unable to reset password");
      }

      router.replace("/sign-in");
      router.refresh();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-pageBg text-textPrimary">
      <section className="mx-auto flex min-h-screen w-full max-w-[1300px] items-center justify-center px-4 py-10 lg:px-6">
        <div className="w-full max-w-[460px] rounded-lg border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-black text-white">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-textSecondary">
              Account recovery
            </p>
            <h1 className="mt-2 font-heading text-4xl font-semibold">
              Forgot password
            </h1>
          </div>

          {codeSent ? (
            <form onSubmit={resetPassword} className="space-y-5">
              <div>
                <label htmlFor="reset-code" className="mb-2 block text-sm font-medium">
                  Reset code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-center text-lg tracking-[0.4em] outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                  maxLength={6}
                  required
                />
                {devOtp ? (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Dev reset code: {devOtp}
                  </p>
                ) : null}
              </div>

              <PasswordField
                id="reset-password"
                label="New password"
                value={password}
                onChange={setPassword}
              />
              <PasswordField
                id="reset-confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              {error ? <ErrorMessage message={error} /> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating..." : "Reset password"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <form onSubmit={requestCode} className="space-y-5">
              <div>
                <label htmlFor="recovery-email" className="mb-2 block text-sm font-medium">
                  Account email
                </label>
                <div className="flex items-center rounded-lg border border-black/15 bg-white px-3 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
                  <Mail className="h-4 w-4 text-textSecondary" aria-hidden="true" />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-11 flex-1 bg-transparent px-3 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              {error ? <ErrorMessage message={error} /> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset code"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-black/10 pt-6">
            <p className="text-center text-sm text-textSecondary">
              Remembered it?{" "}
              <Link href="/sign-in" className="font-medium text-textPrimary hover:opacity-70">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center rounded-lg border border-black/15 bg-white px-3 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
        <LockKeyhole className="h-4 w-4 text-textSecondary" aria-hidden="true" />
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 flex-1 bg-transparent px-3 text-sm outline-none"
          required
        />
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}
