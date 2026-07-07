import { badRequest, ok } from "@/lib/api/http";
import { rateLimitOrResponse } from "@/lib/api/rate-limit";
import { db } from "@/lib/db";
import { contactInquiries } from "@/lib/db/schema";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  const limited = rateLimitOrResponse(request, {
    id: "contact",
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let body: ContactBody;

  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const name = readString(body.name);
  const email = readString(body.email).toLowerCase();
  const phone = readString(body.phone);
  const subject = readString(body.subject);
  const message = readString(body.message);

  if (!name || !email || !subject || !message) {
    return badRequest("Name, email, subject, and message are required");
  }

  if (!emailPattern.test(email)) {
    return badRequest("A valid email is required");
  }

  const [inquiry] = await db
    .insert(contactInquiries)
    .values({
      name,
      email,
      phone: phone || null,
      subject,
      message,
    })
    .returning();

  return ok(
    {
      message: "Contact message received",
      data: {
        id: inquiry.id,
        createdAt: inquiry.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
