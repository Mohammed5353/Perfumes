"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

type LoginResponse =
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

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@scentora.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as LoginResponse;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Unable to login");
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to login",
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
                Restricted access
              </p>
              <h2 className="font-heading text-5xl font-semibold leading-tight">
                Manage catalog and orders from one private workspace.
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
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Admin login
              </p>
              <h2 className="mt-2 font-heading text-4xl font-semibold">
                Sign in
              </h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10">
                  <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-11 flex-1 bg-transparent px-3 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10">
                  <LockKeyhole className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-11 flex-1 bg-transparent px-3 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="text-center text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/admin/signup"
                  className="font-medium text-slate-950 transition hover:text-slate-700"
                >
                  Create one
                </Link>
              </p>
            </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
