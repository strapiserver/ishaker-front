import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import Image from "next/image";
import { NextSeo } from "next-seo";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Header } from "../home/Header";
import CustomTitle from "../home/CutsomTitle";

type Characteristic = {
  label: string;
  value: string;
};

type PlotPoint = {
  label: string;
  output: number;
  demand: number;
};

type ProductPageProps = {
  characteristics: Characteristic[];
  description: string;
  imageAlt: string;
  imageSrc: string;
  plotData: PlotPoint[];
  seoDescription: string;
  title: string;
};

export function ProductPage({
  characteristics,
  description,
  imageAlt,
  imageSrc,
  plotData,
  seoDescription,
  title,
}: ProductPageProps) {
  const pageBg = useColorModeValue("bg.50", "bg.900");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const tableBg = useColorModeValue("bg.10", "bg.800");
  const muted = useColorModeValue("bg.600", "bg.300");
  const chartText = useColorModeValue("#524c4c", "#d6d1ce");
  const gridColor = useColorModeValue(
    "rgba(82, 76, 76, 0.18)",
    "rgba(255, 255, 255, 0.16)",
  );

  return (
    <>
      <NextSeo title={title} description={seoDescription} />
      <Box minH="100vh" bg={pageBg} overflow="hidden">
        <Header borderColor={borderColor} />

        <Box as="main">
          <Container
            maxW="7xl"
            pt={{ base: "8", md: "14" }}
            pb={{ base: "10", md: "16" }}
          >
            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={{ base: "8", lg: "12" }}
              alignItems="center"
            >
              <Stack
                spacing="6"
                maxW="2xl"
                order={{ base: 2, lg: 1 }}
                align={{ base: "center", lg: "flex-start" }}
                textAlign={{ base: "center", lg: "left" }}
              >
                <CustomTitle
                  as="h1"
                  title={title}
                  subtitle={description}
                  mt="0"
                  mb="0"
                  textAlign={{ base: "center", lg: "left" }}
                  fontSize={{ base: "3xl", md: "5xl" }}
                  subtitleProps={{
                    fontSize: { base: "md", md: "lg" },
                    lineHeight: "1.8",
                    mx: "0",
                  }}
                />
              </Stack>

              <Box
                position="relative"
                order={{ base: 1, lg: 2 }}
                justifySelf={{ base: "center", lg: "end" }}
                w={{ base: "min(92vw, 520px)", lg: "100%" }}
                maxW="620px"
                aspectRatio="1"
              >
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(max-width: 991px) 92vw, 620px"
                  style={{ objectFit: "contain" }}
                />
              </Box>
            </SimpleGrid>
          </Container>

          <Box
            as="section"
            bg={tableBg}
            borderY="1px solid"
            borderColor={borderColor}
          >
            <Container maxW="7xl" py={{ base: "10", md: "14" }}>
              <CustomTitle
                as="h2"
                title="Characteristics"
                subtitle="Core machine details for planning placement, operations, and daily service."
                mt="0"
                mb={{ base: "6", md: "8" }}
                fontSize={{ base: "3xl", md: "5xl" }}
                subtitleProps={{
                  fontSize: { base: "md", md: "lg" },
                  lineHeight: "1.7",
                }}
              />

              <TableContainer
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                bg={pageBg}
              >
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Parameter</Th>
                      <Th>Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {characteristics.map((item) => (
                      <Tr key={item.label}>
                        <Td fontWeight="semibold">{item.label}</Td>
                        <Td color={muted}>{item.value}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Container>
          </Box>

          <Box
            as="section"
            bgGradient="linear(135deg, violet.900 0%, bg.900 45%, acid.800 100%)"
            color="white"
          >
            <Container maxW="7xl" py={{ base: "10", md: "16" }}>
              <SimpleGrid
                columns={{ base: 1, lg: 2 }}
                spacing={{ base: "8", lg: "12" }}
                alignItems="center"
              >
                <Stack spacing="3">
                  <Text
                    as="h2"
                    fontSize={{ base: "3xl", md: "5xl" }}
                    fontWeight="bold"
                    lineHeight="1"
                  >
                    Daily output profile
                  </Text>
                  <Text
                    color="whiteAlpha.800"
                    fontSize={{ base: "md", md: "lg" }}
                    lineHeight="1.8"
                  >
                    Example service curve showing how the machine keeps demand
                    covered across morning, lunch, and evening traffic.
                  </Text>
                </Stack>

                <Box h={{ base: "280px", md: "360px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={plotData}
                      margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="outputGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#76f85f" stopOpacity={0.86} />
                          <stop offset="95%" stopColor="#76f85f" stopOpacity={0.08} />
                        </linearGradient>
                        <linearGradient
                          id="demandGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#a59deb" stopOpacity={0.72} />
                          <stop offset="95%" stopColor="#a59deb" stopOpacity={0.06} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartText, fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartText, fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#141313",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          borderRadius: "8px",
                          color: "#ffffff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="demand"
                        name="Demand"
                        stroke="#a59deb"
                        strokeWidth={2}
                        fill="url(#demandGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="output"
                        name="Served shakes"
                        stroke="#76f85f"
                        strokeWidth={3}
                        fill="url(#outputGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </SimpleGrid>
            </Container>
          </Box>
        </Box>
      </Box>
    </>
  );
}
