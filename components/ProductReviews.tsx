"use client";

import { BadgeCheck, Send, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { ProductReviewItem, ReviewSummary } from "@/lib/review-types";

type ProductReviewsProps = {
  productId: string;
  productPath: string;
  initialReviews: ProductReviewItem[];
  initialSummary: ReviewSummary;
};

type ReviewsResponse =
  | {
      data: ProductReviewItem[];
      meta: ReviewSummary;
    }
  | {
      error: string;
    };

export default function ProductReviews({
  productId,
  productPath,
  initialReviews,
  initialSummary,
}: ProductReviewsProps) {
  const router = useRouter();
  const { user } = useUser();
  const [reviews, setReviews] = useState(initialReviews);
  const [summary, setSummary] = useState(initialSummary);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshReviews() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        cache: "no-store",
      });
      const body = (await response.json()) as ReviewsResponse;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Failed to load reviews");
      }

      setReviews(body.data);
      setSummary(body.meta);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title,
          comment,
        }),
      });
      const body = (await response.json()) as ReviewsResponse;

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Unable to submit review");
      }

      setTitle("");
      setComment("");
      setRating(5);
      await refreshReviews();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const ratingPercentages = [5, 4, 3, 2, 1].map((value) => {
    const count = summary.ratingCounts[value as 1 | 2 | 3 | 4 | 5];
    const percent = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;

    return {
      value,
      count,
      percent,
    };
  });

  return (
    <section
      id="reviews"
      className="mt-12 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
    >
      <div className="border-b border-black/10 bg-[#f7edd8] px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-textSecondary">
              Customer reviews
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-textPrimary">
              Share your experience
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-textSecondary">
              Tell other customers how this fragrance performed for you. Your feedback helps us
              improve the catalog and helps shoppers choose with confidence.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold">{summary.averageRating.toFixed(1)}</span>
              <div>
                <div className="flex items-center gap-0.5 text-accent">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${index < Math.round(summary.averageRating) ? "fill-current" : ""}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-xs text-textSecondary">
                  {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {summary.verifiedPurchaseReviews > 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                {summary.verifiedPurchaseReviews} verified purchase review
                {summary.verifiedPurchaseReviews === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-black/10 bg-[#faf6ef] p-5">
            <p className="text-sm font-semibold text-textPrimary">Rating breakdown</p>
            <div className="mt-4 space-y-3">
              {ratingPercentages.map((item) => (
                <div key={item.value} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-semibold text-textSecondary">{item.value}</span>
                  <Star className="h-4 w-4 fill-current text-accent" aria-hidden="true" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-textSecondary">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#f6f1ea] p-5">
            <p className="text-sm font-semibold text-textPrimary">Your review</p>
            <p className="mt-2 text-sm leading-6 text-textSecondary">
              {user
                ? "You can leave a rating, describe the scent trail, and share how long it lasted for you."
                : "Sign in to post your experience and help other shoppers decide."}
            </p>

            {user ? (
              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Rating</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }, (_, index) => {
                      const value = index + 1;
                      const active = value <= rating;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-sm font-semibold transition ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-black/15 bg-white hover:bg-black/5"
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${active ? "fill-current" : ""}`}
                            aria-hidden="true"
                          />
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={80}
                    className="min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                    placeholder="What stood out to you?"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Experience</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    minLength={20}
                    maxLength={1200}
                    rows={6}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                    placeholder="Share how the fragrance smelled, how long it lasted, and whether it matched your expectations."
                    required
                  />
                </label>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit review"}
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <div className="mt-5">
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent(productPath)}`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-black/85"
                >
                  Sign in to review
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-textSecondary">
              Recent feedback
            </p>
            <button
              type="button"
              onClick={() => void refreshReviews()}
              disabled={loading}
              className="text-sm font-medium text-textSecondary hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-textPrimary">
                          {review.user.name || review.user.email}
                        </p>
                        {review.verifiedPurchase ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Verified purchase
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center gap-0.5 text-accent">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-black/15"}`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="shrink-0 text-xs text-textSecondary">{formatDate(review.createdAt)}</p>
                  </div>

                  {review.title ? (
                    <h3 className="mt-4 text-lg font-semibold text-textPrimary">{review.title}</h3>
                  ) : null}
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-textSecondary">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#faf6ef] p-6 text-sm text-textSecondary">
              No reviews yet. Be the first to share how this fragrance performed for you.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
