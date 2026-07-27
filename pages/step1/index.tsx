import { Box, useColorModeValue } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import { Header } from "../../components/home/Header";
import { SerialNumberSection } from "../../components/step1/SerialNumberSection";
import type { GetServerSideProps } from "next";
import { resolvePortalSession } from "../../lib/portal/auth";

type Step1PageProps = {
  existingAccount?: {
    clientId: string | number;
    nickname: string;
    country?: string;
    state?: string;
    city?: string;
  } | null;
};

export default function Step1Page({ existingAccount }: Step1PageProps) {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <>
      <NextSeo
        title="Step 1 | iShaker"
        description="Add your machine serial number to start setting up your iShaker machine."
      />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />
        <Box as="main">
          <SerialNumberSection existingAccount={existingAccount} />
        </Box>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Step1PageProps> = async (
  context,
) => {
  try {
    const session = await resolvePortalSession(context.req.headers.cookie);
    if (!session || session.access !== "client") return { props: {} };

    return {
      props: {
        existingAccount: {
          clientId: session.client.id,
          nickname: session.client.company,
          country: session.client.country || "USA",
          state: session.client.state || "",
          city: session.client.city || "",
        },
      },
    };
  } catch (error) {
    console.error("[step1] session lookup failed:", error);
    return { props: {} };
  }
};
