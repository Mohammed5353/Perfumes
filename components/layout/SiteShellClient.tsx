"use client";

import { useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import PromoBar from "@/components/common/PromoBar";
import { mergeGuestCartIntoAccount } from "@/lib/guest-cart";

type SiteSettings = {
  promoBannerText: string;
  facebookUrl: string;
  xUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  contactPhone: string;
  contactEmail: string;
};

export default function SiteShellClient({
  children,
  settings,
}: {
  children: ReactNode;
  settings: SiteSettings;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const { isSignedIn, user } = useUser();
  const mergedUserIds = useRef(new Set<string>());

  useEffect(() => {
    if (!isSignedIn || !user?.id || mergedUserIds.current.has(user.id)) {
      return;
    }

    mergedUserIds.current.add(user.id);
    void mergeGuestCartIntoAccount();
  }, [isSignedIn, user?.id]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <PromoBar text={settings.promoBannerText} />
      <Navbar />
      {children}
      <Footer settings={settings} />
    </>
  );
}
