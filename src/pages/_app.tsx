import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Fragment, type ReactElement } from "react";
import { SITE_CONFIG } from "@/config/site";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function MyApp({ Component, pageProps }: AppProps): ReactElement {
  return (
    <Fragment>
      <Head>
        <link rel="icon" href={SITE_CONFIG.seo.imageUrl} />
      </Head>
      <TooltipProvider delayDuration={150}>
        <Component {...pageProps} />
      </TooltipProvider>
    </Fragment>
  );
}
