import { Fragment } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { ArrowLeftIcon } from "lucide-react";
import { ARCADE_GAMES } from "@/config/arcade";
import { DERIVED_CONFIG, SITE_CONFIG } from "@/config/site";
import { ArcadeGames } from "@/components/arcade";
import { Button } from "@/components/ui/button";
import type { ArcadeGame } from "@/types";
import styles from "@/components/arcade/Arcade.module.css";

interface ArcadePageProps {
  games: readonly ArcadeGame[];
}

export const getStaticProps: GetStaticProps<ArcadePageProps> = async () => ({
  props: { games: ARCADE_GAMES },
});

export default function Arcade({ games }: ArcadePageProps): React.ReactElement {
  const title = `${DERIVED_CONFIG.possessiveName} Arcade`;
  const description = "Small games, made for the browser.";
  const canonicalUrl = `${DERIVED_CONFIG.siteUrl}arcade/`;

  return (
    <Fragment>
      <Head>
        <title>{`${title} | ${SITE_CONFIG.fullName}`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>
      <div className="relative min-h-svh shrink-0 bg-background px-4 pb-10 text-foreground sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,oklch(0.24_0.008_285.95_/_0.38),transparent_68%)]" />
        <nav aria-label="Arcade navigation" className="relative z-10 mx-auto flex max-w-4xl items-center justify-between pt-5">
          <Button asChild variant="outline" size="lg" className="min-h-11 bg-card/70" tooltip="Back to home">
            <Link href="/" aria-label="Back to home"><ArrowLeftIcon aria-hidden="true" />Home</Link>
          </Button>
        </nav>
        <header className="relative z-10 py-8 text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        </header>
        <main className={`${styles.main} relative z-10 mx-auto w-full max-w-4xl`}>
          <ArcadeGames games={games} />
        </main>
      </div>
    </Fragment>
  );
}
