 "use client";

import { Skeleton } from "boneyard-js/react";

export default function Loading() {
  return (
    <main className="min-h-screen overflow-hidden bg-pageBg text-textPrimary">
      <section className="mx-auto w-full max-w-[1360px] px-4 py-6 font-body lg:px-6 lg:py-8">
        <Skeleton
          name="product-page"
          loading
          fixture={
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:items-start">
              <section className="min-h-[520px] overflow-hidden rounded-2xl bg-[#16110d]" />
              <section className="min-h-[520px] rounded-2xl border border-black/10 bg-white" />
            </div>
          }
        >
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:items-start">
            <section className="min-h-[520px] overflow-hidden rounded-2xl bg-[#16110d]" />
            <section className="min-h-[520px] rounded-2xl border border-black/10 bg-white" />
          </div>
        </Skeleton>
      </section>
    </main>
  );
}
