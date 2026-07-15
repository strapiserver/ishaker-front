import {
  AspectRatio,
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  VStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { getStrapiBaseUrl } from "../../services/fetchers";
import type { Article, StrapiImage } from "../../types/article";
import { Header } from "../home/Header";

const imageValue = (image?: StrapiImage | null) =>
  image?.data?.attributes || image?.data || image?.attributes || image;

const machinePreviewUrl = (image?: StrapiImage | null) => {
  const value = imageValue(image);
  const url =
    value?.formats?.small?.url ||
    value?.formats?.thumbnail?.url ||
    value?.formats?.medium?.url ||
    value?.url;

  if (!url) return null;
  return /^(https?:)?\/\//i.test(url)
    ? url
    : `${getStrapiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
};

const fallbackMachinePreview = (name?: string | null) => {
  const normalized = name?.toLowerCase() || "";
  if (normalized.includes("touch")) return "/shaker-touch.png";
  if (normalized.includes("shaker s") || normalized === "s") {
    return "/shaker-s.png";
  }
  return null;
};

function ArticleCard({ article }: { article: Article }) {
  const machineTypes = article.machine_types || [];
  const primaryMachine = machineTypes[0];
  const preview =
    machinePreviewUrl(primaryMachine?.preview) ||
    fallbackMachinePreview(primaryMachine?.name);

  return (
    <Box
      as={NextLink}
      href={`/articles/${encodeURIComponent(article.code.toLowerCase())}`}
      display="flex"
      flexDirection="column"
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      overflow="hidden"
      minH="100%"
      boxShadow="0 18px 55px rgba(0, 0, 0, 0.18)"
      transition="transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease"
      _hover={{
        transform: "translateY(-5px)",
        borderColor: "rgba(118, 248, 95, 0.45)",
        boxShadow: "0 25px 70px rgba(0, 0, 0, 0.32)",
      }}
      role="group"
    >
      <AspectRatio ratio={16 / 9} bg="bg.800" overflow="hidden">
        {preview ? (
          <Image
            src={preview}
            alt={primaryMachine?.name || article.header || "iShaker article"}
            objectFit="contain"
            p="5"
            transition="transform 220ms ease"
            _groupHover={{ transform: "scale(1.035)" }}
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            position="relative"
            bgGradient="radial(circle at 50% 65%, rgba(118,248,95,0.16), transparent 58%)"
          >
            <Text color="acid.300" fontSize="5xl" fontWeight="900" letterSpacing="-0.08em">
              iS
            </Text>
          </Flex>
        )}
      </AspectRatio>

      <VStack spacing="4" p={{ base: "5", md: "6" }} flex="1" align="stretch">
        <Flex gap="2" wrap="wrap">
          {machineTypes.length ? (
            machineTypes.map((machine) => (
              <Badge
                key={machine.id}
                bg="whiteAlpha.100"
                color="acid.200"
                borderRadius="full"
                px="2.5"
                py="1"
                textTransform="capitalize"
              >
                {machine.name || "iShaker"}
              </Badge>
            ))
          ) : (
            <Badge bg="whiteAlpha.100" color="bg.300" borderRadius="full" px="2.5" py="1">
              iShaker
            </Badge>
          )}
        </Flex>

        <Box flex="1">
          <Heading as="h2" color="bg.50" fontSize={{ base: "xl", md: "2xl" }} lineHeight="1.25" m="0" mb="3">
            {article.header || article.code}
          </Heading>
          {article.subheader ? (
            <Text color="bg.300" lineHeight="1.7" noOfLines={3}>
              {article.subheader}
            </Text>
          ) : null}
        </Box>

        <Flex align="center" gap="2" color="acid.300" fontWeight="800">
          <Text>Read article</Text>
          <Box transition="transform 180ms ease" _groupHover={{ transform: "translateX(4px)" }}>
            <FaArrowRight />
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
}

export function ArticlesIndexPage({ articles }: { articles: Article[] }) {
  const pageBg = useColorModeValue("bg.50", "bg.1000");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  return (
    <Box minH="100vh" bg={pageBg} position="relative" overflow="hidden">
      <Box position="absolute" top="50px" left="-180px" w="560px" h="560px" bg="acid.400" opacity="0.06" filter="blur(120px)" borderRadius="full" pointerEvents="none" />
      <Box position="absolute" top="440px" right="-220px" w="600px" h="600px" bg="violet.500" opacity="0.08" filter="blur(140px)" borderRadius="full" pointerEvents="none" />

      <Header borderColor={borderColor} />

      <Container as="main" maxW="7xl" position="relative" pt={{ base: "12", md: "20" }} pb={{ base: "16", md: "28" }}>
        <VStack
          spacing="6"
          maxW="820px"
          mb={{ base: "10", md: "14" }}
          align="stretch"
        >
          <Badge alignSelf="flex-start" px="3" py="1.5" borderRadius="full" bg="acid.300" color="bg.1000" fontSize="xs" letterSpacing="0.13em">
            Knowledge center
          </Badge>
          <Heading as="h1" color="bg.50" fontSize={{ base: "4xl", md: "6xl" }} lineHeight="1.02" letterSpacing="-0.04em" m="0">
            iShaker articles
          </Heading>
          <Text color="bg.300" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7">
            Setup instructions, troubleshooting guides, and practical answers for keeping your iShaker running smoothly.
          </Text>
          <Text color="bg.400" fontWeight="700">
            {articles.length} {articles.length === 1 ? "article" : "articles"}
          </Text>
        </VStack>

        {articles.length ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: "6", lg: "8" }}>
            {articles.map((article) => (
              <ArticleCard key={article.id || article.code} article={article} />
            ))}
          </SimpleGrid>
        ) : (
          <Box bg="bg.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" p={{ base: "7", md: "10" }} textAlign="center">
            <Heading as="h2" color="bg.50" fontSize="2xl" mb="3">
              No articles yet
            </Heading>
            <Text color="bg.300">New guides will appear here when they are published.</Text>
          </Box>
        )}
      </Container>
    </Box>
  );
}
