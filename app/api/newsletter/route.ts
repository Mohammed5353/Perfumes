import { badRequest, ok } from "@/lib/api/http";
import { rateLimitOrResponse } from "@/lib/api/rate-limit";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const limited = rateLimitOrResponse(request, {
    id: "newsletter",
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!isNewsletterRequest(body)) {
    return badRequest("A valid email is required");
  }

  const email = body.email.toLowerCase();
  const [subscriber] = await db
    .insert(newsletterSubscribers)
    .values({ email })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: { email },
    })
    .returning();

  return ok(
    {
      message: "Newsletter subscription received",
      data: {
        id: subscriber.id,
        email: subscriber.email,
        createdAt: subscriber.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}

function isNewsletterRequest(value: unknown): value is { email: string } {
  if (!value || typeof value !== "object" || !("email" in value)) {
    return false;
  }

  const email = (value as { email: unknown }).email;

  return typeof email === "string" && emailPattern.test(email);
}
