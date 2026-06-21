import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { DefaultSeo } from "next-seo";
import Head from "next/head";
import theme from "../styles/theme";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <ChakraProvider theme={theme}>
        <DefaultSeo
          titleTemplate="%s | iShaker"
          defaultTitle="iShaker"
          description="A polished digital home for iShaker."
          openGraph={{
            type: "website",
            locale: "en_US",
            siteName: "iShaker",
          }}
        />
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}

export default MyApp;
