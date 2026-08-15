import { Link } from "@hacado/ui";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
type Marketing404ContentProps = {
  marketingBaseUrl: string;
  adminBaseUrl: string;
};

function MarketingFooter({
  marketingBaseUrl,
}: Pick<Marketing404ContentProps, "marketingBaseUrl">) {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-center text-sm text-muted-foreground">
          The all-in-one appointment scheduling platform for modern businesses.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}{" "}
          <Link
            href={marketingBaseUrl}
            variant="underline"
            className="text-muted-foreground"
          >
            Hacado
          </Link>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function MarketingHeader({
  marketingBaseUrl,
  adminBaseUrl,
}: Marketing404ContentProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <a
          href={marketingBaseUrl}
          className="-m-1.5 flex items-center gap-2 p-1.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg">
            <Image src="/logo.png" alt="Hacado" width={36} height={36} />
          </div>
          <span className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hacado
          </span>
        </a>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            size="sm"
            variant="ghost"
            href={`${adminBaseUrl}/auth/signin`}
            button
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            size="sm"
            variant="brand"
            button
            href={`${adminBaseUrl}/auth/signup`}
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function Marketing404Content({
  marketingBaseUrl,
  adminBaseUrl,
}: Marketing404ContentProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader
        marketingBaseUrl={marketingBaseUrl}
        adminBaseUrl={adminBaseUrl}
      />
      <main className="relative flex flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/8 via-transparent to-transparent dark:from-primary/5"
        />
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
          <p className="select-none text-8xl font-extrabold tracking-tight text-primary/10 sm:text-9xl">
            404
          </p>
          <div className="-mt-4 space-y-4 sm:-mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              This booking page is unavailable
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              We couldn&apos;t find a booking site at this address
            </h1>
            <p className="text-balance text-muted-foreground sm:text-lg">
              The link may be wrong, or the business may have moved. Build your
              own booking page with Hacado and take appointments online in
              minutes.
            </p>
          </div>
          <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:justify-center sm:gap-4">
            <Link
              size="2xl"
              variant="brand-dark"
              button
              href={`${adminBaseUrl}/auth/signup`}
              className="group/button hover:-translate-y-1 transition-all duration-300"
            >
              Create your booking website
              <ArrowRight
                className="group-hover/button:animate-bounce-horizontal"
                aria-hidden
              />
            </Link>
            <span className="text-muted-foreground">or</span>
            <Link size="lg" variant="outline" button href={marketingBaseUrl}>
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              <span className="whitespace-nowrap">
                Explore <span className="font-display">hacado.com</span>
              </span>
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter marketingBaseUrl={marketingBaseUrl} />
    </div>
  );
}
