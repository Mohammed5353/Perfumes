"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, User } from "lucide-react";

type SignupResponse =
  | {
      message: string;
      data: {
        id: string;
        email: string;
        name: string | null;
        role: "ADMIN";
      };
    }
  | {
      error: string;
    };

export default function AdminSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

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
      const response = await fetch("/api/admin/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const body = (await response.json()) as SignupResponse;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Unable to create account");
      }

      router.replace("/admin");
      router.refresh();
    } catch (signupError) {
      setError(
        signupError instanceof Error ? signupError.message : "Unable to create account",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-pageBg text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[#0f172a] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(252,140,61,0.28),transparent_32%),linear-gradient(145deg,#0f172a_0%,#111827_45%,#1f2937_100%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  Scentora
                </p>
                <h1 className="text-xl font-semibold">Admin Console</h1>
              </div>
            </div>

            <div className="max-w-md">
              <p className="mb-6 text-sm font-medium uppercase tracking-[0.24em] text-orange-200">
                Create account
              </p>
              <h2 className="font-heading text-5xl font-semibold leading-tight">
                Join the admin team and manage your catalog.
              </h2>
            </div>

            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/8">
              <Image
                src="/images/perfume-blue.webp"
                alt="Scentora perfume bottle"
                width={900}
                height={640}
                className="h-64 w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-[440px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-semibold">Create Admin Account</h1>
              <p className="mt-1 text-sm text-slate-600">Join the Scentora admin team</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <div className="relative mt-2">
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pl-10 text-slate-900 placeholder-slate-500 transition focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@scentora.com"
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pl-10 text-slate-900 placeholder-slate-500 transition focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pl-10 text-slate-900 placeholder-slate-500 transition focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pl-10 text-slate-900 placeholder-slate-500 transition focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <div className="absolute inset-y-0 left-0 flex w-0 items-center justify-center bg-black transition-all duration-300 group-hover:w-12">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </div>
                <span>{loading ? "Creating account..." : "Create Account"}</span>
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/admin/login"
                  className="font-medium text-slate-950 transition hover:text-slate-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
