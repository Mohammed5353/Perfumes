import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type CustomerUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER";
};

export async function requireCustomerUser(): Promise<CustomerUser | null> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ??
    clerkUser.emailAddresses[0]?.emailAddress?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const lastLoginAt = clerkUser.lastSignInAt ?? new Date();
  const nextLastLoginAt = new Date(lastLoginAt);
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.fullName?.trim() ||
    null;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      lastLoginAt: true,
    },
  });

  if (existingUser) {
    if (existingUser.role !== "USER") {
      return null;
    }

    const shouldUpdateName = name !== null && existingUser.name !== name;
    const existingLastLoginAt = existingUser.lastLoginAt
      ? new Date(existingUser.lastLoginAt).getTime()
      : null;
    const shouldUpdateLoginAt =
      existingLastLoginAt !== nextLastLoginAt.getTime();

    if (shouldUpdateName || shouldUpdateLoginAt) {
      await db
        .update(users)
        .set({
          ...(shouldUpdateName ? { name } : {}),
          ...(shouldUpdateLoginAt ? { lastLoginAt: nextLastLoginAt } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: shouldUpdateName ? name : existingUser.name,
      role: "USER",
    };
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      name,
      email,
      role: "USER",
      emailVerifiedAt: new Date(),
      lastLoginAt: nextLastLoginAt,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  if (!createdUser) {
    return null;
  }

  return {
    id: createdUser.id,
    email: createdUser.email,
    name: createdUser.name,
    role: "USER",
  };
}
