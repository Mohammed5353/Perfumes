import { SignUp } from "@clerk/nextjs";

type SearchParams = {
  redirect_url?: string | string[];
};

function getRedirectUrl(searchParams: SearchParams, fallback: string) {
  const value = Array.isArray(searchParams.redirect_url)
    ? searchParams.redirect_url[0]
    : searchParams.redirect_url;

  if (!value || value.startsWith("//")) {
    return fallback;
  }

  return value.startsWith("/") ? value : fallback;
}

export default function Page({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const redirectUrl = getRedirectUrl(searchParams ?? {}, "/account");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[1100px] items-center justify-center px-4 py-10">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
      />
    </main>
  );
}
