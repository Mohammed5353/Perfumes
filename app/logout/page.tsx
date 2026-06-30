import type { Metadata } from "next";
import { SignOutButton } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Out | Scentora",
  description: "Sign out of your Scentora account.",
};

export default function LogoutPage() {
  return (
    <main className="bg-pageBg">
      <section className="mx-auto flex min-h-screen w-full max-w-[760px] items-center justify-center px-4 py-10">
        <div className="w-full rounded-lg border border-black/10 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-textSecondary">
            SCENTORA session
          </p>
          <h1 className="mt-3 text-3xl font-heading font-bold text-textPrimary sm:text-4xl">
            Sign out
          </h1>
          <p className="mt-3 text-sm leading-6 text-textSecondary">
            End your SCENTORA session to leave this account.
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/85"
              >
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </section>
    </main>
  );
}
