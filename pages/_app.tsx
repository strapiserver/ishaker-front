import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { DefaultSeo } from "next-seo";
import Head from "next/head";
import { Provider } from "react-redux";
import theme from "../styles/theme";
import store from "../redux/store";
import { Footer } from "../components/Footer";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <Provider store={store}>
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
          <Footer />
        </ChakraProvider>
      </Provider>
    </>
  );
}

export default MyApp;
