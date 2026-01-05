import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Fragment } from "react/jsx-runtime";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <link rel="icon" href="https://avatars.githubusercontent.com/u/81255462?v=4" />
      </Head>
      <Component {...pageProps} />
    </Fragment>
  );
}
