import { Box } from "@chakra-ui/react";
import { NextSeo } from "next-seo";
import type { PropsWithChildren } from "react";
import { AdminHeader } from "./AdminHeader";

export function AdminShell({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <>
      <NextSeo title={`${title} | Admin`} noindex nofollow />
      <Box minH="100vh" bg="bg.1000" color="bg.100">
        <AdminHeader title={title} />
        <Box maxW="1440px" mx="auto" px={{ base: 4, md: 8 }} py={8}>
          {children}
        </Box>
      </Box>
    </>
  );
}
