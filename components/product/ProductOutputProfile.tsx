import {
  Box,
  Container,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlotPoint } from "./types";

type ProductOutputProfileProps = {
  plotData: PlotPoint[];
};

export function ProductOutputProfile({
  plotData,
}: ProductOutputProfileProps) {
  const chartText = useColorModeValue("#524c4c", "#d6d1ce");
  const gridColor = useColorModeValue(
    "rgba(82, 76, 76, 0.18)",
    "rgba(255, 255, 255, 0.16)",
  );

  return (
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
          <VStack spacing="3" align="stretch">
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
          </VStack>

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
  );
}
