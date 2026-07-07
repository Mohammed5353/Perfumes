import { requireAdminUser } from "@/lib/admin-auth";
import { badRequest, unauthorized } from "@/lib/api/http";
import {
  getSiteSettings,
  CONTACT_EMAIL_KEY,
  CONTACT_PHONE_KEY,
  FACEBOOK_URL_KEY,
  HOME2_PROMO_SLIDES_KEY,
  INSTAGRAM_URL_KEY,
  PROMO_BANNER_TEXT_KEY,
  setSiteSetting,
  X_URL_KEY,
  YOUTUBE_URL_KEY,
} from "@/lib/site-settings";

type SiteSettingsBody = {
  promoBannerText?: unknown;
  facebookUrl?: unknown;
  xUrl?: unknown;
  youtubeUrl?: unknown;
  instagramUrl?: unknown;
  contactPhone?: unknown;
  contactEmail?: unknown;
  home2PromoSlides?: unknown;
};

export async function GET() {
  const admin = await requireAdminUser();

  if (!admin) {
    return unauthorized("Admin login required");
  }

  return Response.json({
    data: await getSiteSettings(),
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminUser();

  if (!admin) {
    return unauthorized("Admin login required");
  }

  const body = await readBody(request);
  const promoBannerText =
    typeof body.promoBannerText === "string" ? body.promoBannerText.trim() : "";
  const facebookUrl = normalizeString(body.facebookUrl);
  const xUrl = normalizeString(body.xUrl);
  const youtubeUrl = normalizeString(body.youtubeUrl);
  const instagramUrl = normalizeString(body.instagramUrl);
  const contactPhone = normalizeString(body.contactPhone);
  const contactEmail = normalizeString(body.contactEmail);
  const home2PromoSlides = normalizeSlides(body.home2PromoSlides);

  if (!promoBannerText) {
    return badRequest("Promotional line is required");
  }

  if (home2PromoSlides.length === 0) {
    return badRequest("At least one Home 2 promotional slide is required");
  }

  await setSiteSetting(PROMO_BANNER_TEXT_KEY, promoBannerText);
  await Promise.all([
    setSiteSetting(FACEBOOK_URL_KEY, facebookUrl),
    setSiteSetting(X_URL_KEY, xUrl),
    setSiteSetting(YOUTUBE_URL_KEY, youtubeUrl),
    setSiteSetting(INSTAGRAM_URL_KEY, instagramUrl),
    setSiteSetting(CONTACT_PHONE_KEY, contactPhone),
    setSiteSetting(CONTACT_EMAIL_KEY, contactEmail),
    setSiteSetting(HOME2_PROMO_SLIDES_KEY, JSON.stringify(home2PromoSlides)),
  ]);

  return Response.json({
    data: await getSiteSettings(),
    message: "Settings updated",
  });
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlides(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((slide) => {
      if (!slide || typeof slide !== "object") {
        return null;
      }

      const record = slide as Record<string, unknown>;

      return {
        eyebrow: normalizeString(record.eyebrow),
        title: normalizeString(record.title),
        description: normalizeString(record.description),
        image: normalizeString(record.image),
        href: normalizeString(record.href) || "/shop/all",
        cta: normalizeString(record.cta) || "Shop now",
      };
    })
    .filter((slide) => Boolean(slide?.title && slide.description && slide.image));
}

async function readBody(request: Request): Promise<SiteSettingsBody> {
  try {
    return (await request.json()) as SiteSettingsBody;
  } catch {
    return {};
  }
}
