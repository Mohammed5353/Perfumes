import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export const PROMO_BANNER_TEXT_KEY = "promo_banner_text";
export const FACEBOOK_URL_KEY = "facebook_url";
export const X_URL_KEY = "x_url";
export const YOUTUBE_URL_KEY = "youtube_url";
export const INSTAGRAM_URL_KEY = "instagram_url";
export const CONTACT_PHONE_KEY = "contact_phone";
export const CONTACT_EMAIL_KEY = "contact_email";
export const DEFAULT_PROMO_BANNER_TEXT =
  "Free Shipping on Orders over 30KWD - Arrives Next Day From 5 to 9 PM";
export const DEFAULT_CONTACT_PHONE = "+96500000000";
export const DEFAULT_CONTACT_EMAIL = "support@scentora.com";

export async function getSiteSettings() {
  const promoBannerText = await ensureSiteSetting(
    PROMO_BANNER_TEXT_KEY,
    DEFAULT_PROMO_BANNER_TEXT,
  );
  const [
    facebookUrl,
    xUrl,
    youtubeUrl,
    instagramUrl,
    contactPhone,
    contactEmail,
  ] = await Promise.all([
    getSiteSetting(FACEBOOK_URL_KEY),
    getSiteSetting(X_URL_KEY),
    getSiteSetting(YOUTUBE_URL_KEY),
    getSiteSetting(INSTAGRAM_URL_KEY),
    ensureSiteSetting(CONTACT_PHONE_KEY, DEFAULT_CONTACT_PHONE),
    ensureSiteSetting(CONTACT_EMAIL_KEY, DEFAULT_CONTACT_EMAIL),
  ]);

  return {
    promoBannerText,
    facebookUrl,
    xUrl,
    youtubeUrl,
    instagramUrl,
    contactPhone,
    contactEmail,
  };
}

export async function getSiteSetting(key: string, fallback = "") {
  try {
    const row = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });

    return row?.value ?? fallback;
  } catch {
    // During builds or misconfigured environments (e.g. no DB connectivity),
    // fall back to a safe default so the app can still render.
    return fallback;
  }
}

async function ensureSiteSetting(key: string, fallback: string) {
  const value = await getSiteSetting(key, "");

  if (value) {
    return value;
  }

  try {
    await setSiteSetting(key, fallback);
  } catch {
    // If we can't reach the DB (e.g. during build), just return the fallback.
    return fallback;
  }

  return fallback;
}

export async function setSiteSetting(key: string, value: string) {
  const now = new Date();

  await db
    .insert(siteSettings)
    .values({
      key,
      value,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value,
        updatedAt: now,
      },
    });
}
