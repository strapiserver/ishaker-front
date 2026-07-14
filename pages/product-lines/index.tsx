import {
  Badge,
  Box,
  Button,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { PortalShell } from "../../components/portal/PortalShell";
import { requirePortalSession } from "../../lib/portal/auth";
import { getSmallestMediaUrl } from "../../lib/portal/media";
import { requestStrapiRestAsService } from "../../services/server/strapiClient";
import type { PortalProductLine, PortalSession } from "../../types/portal";

type ProductLinesPageProps = {
  session: PortalSession;
  productLines: PortalProductLine[];
  loadError?: string;
};

const createListParams = (authorFilter: { id?: number; username?: string }) => {
  const params = new URLSearchParams();
  if (authorFilter.id) {
    params.set("filters[author][id][$eq]", String(authorFilter.id));
  }
  if (authorFilter.username) {
    params.set("filters[author][username][$eq]", authorFilter.username);
  }
  params.set("populate[0]", "author");
  params.set("populate[1]", "cup.image");
  params.set("populate[2]", "brand.logo");
  params.set("populate[3]", "base_product_line");
  params.set("sort[0]", "name:ASC");
  params.set("pagination[pageSize]", "100");
  return params;
};

export default function ProductLinesPage({
  session,
  productLines,
  loadError,
}: ProductLinesPageProps) {
  return (
    <PortalShell
      title="Product lines"
      description="Product lines published by iShaker root and product lines created by you."
      clientName={session.client.company}
      access={session.access}
    >
      <Button as={Link} href="/product-lines/new" variant="primary" size="lg" mb="8">
        + New product line
      </Button>

      {loadError ? (
        <Text color="orange.200" mb="5">
          {loadError}
        </Text>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="5">
        {productLines.map((line) => {
          const cupImage = getSmallestMediaUrl(line.cup?.image);
          const brandImage = getSmallestMediaUrl(line.brand?.logo);
          const isOwn = String(line.author?.id) === String(session.user.id);

          return (
            <Box
              key={line.id}
              bg="bg.900"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="2xl"
              overflow="hidden"
              p="5"
            >
              <Stack direction="row" spacing="4" align="center">
                <Box
                  boxSize="88px"
                  flex="0 0 auto"
                  borderRadius="xl"
                  bg="whiteAlpha.50"
                  p="2"
                >
                  {cupImage ? (
                    <Image src={cupImage} alt={line.cup?.name || "Cup"} w="full" h="full" objectFit="contain" />
                  ) : null}
                </Box>
                <Stack spacing="2" minW="0">
                  <Text color="bg.50" fontWeight="800" fontSize="xl" noOfLines={2}>
                    {line.name}
                  </Text>
                  <Badge colorScheme={isOwn ? "green" : "purple"} alignSelf="flex-start">
                    {isOwn ? "Yours" : "iShaker"}
                  </Badge>
                  {line.cup?.name ? <Text color="bg.300">{line.cup.name}</Text> : null}
                </Stack>
              </Stack>
              {line.brand ? (
                <Stack direction="row" align="center" spacing="2" mt="4" pt="4" borderTop="1px solid" borderColor="whiteAlpha.100">
                  {brandImage ? <Image src={brandImage} alt="" boxSize="24px" objectFit="contain" /> : null}
                  <Text color="bg.300" fontSize="sm">{line.brand.name}</Text>
                </Stack>
              ) : null}
            </Box>
          );
        })}
      </SimpleGrid>

      {!productLines.length && !loadError ? (
        <Text color="bg.300">No product lines are available yet.</Text>
      ) : null}
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<ProductLinesPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  try {
    const [rootProductLines, ownProductLines] = await Promise.all([
      requestStrapiRestAsService<PortalProductLine[]>(
        `/api/product-lines?${createListParams({ username: "root" }).toString()}`,
      ),
      requestStrapiRestAsService<PortalProductLine[]>(
        `/api/product-lines?${createListParams({ id: result.session.user.id }).toString()}`,
      ),
    ]);
    const productLines = [...ownProductLines, ...rootProductLines].filter(
      (line, index, all) =>
        all.findIndex((candidate) => String(candidate.id) === String(line.id)) === index,
    );

    return { props: { session: result.session, productLines } };
  } catch (error) {
    console.error("[product-lines] loading failed:", error);
    return {
      props: {
        session: result.session,
        productLines: [],
        loadError: "Product lines could not be loaded.",
      },
    };
  }
};
