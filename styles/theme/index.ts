import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";
import components from "./components";
import colors from "./colors";

const breakpoints = {
  xs: "26rem",
  sm: "30rem",
  md: "48rem",
  lg: "62rem",
  xl: "80rem",
  "2xl": "96rem",
};

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const shadows = { outline: "0 !important" };

const fonts = {
  logo: "Dosis",
};

const styles = {
  global: (props: any) => ({
    body: {
      bg: mode("bg.200", "bg.900")(props),
      color: "bg.100",
    },
    h1: {
      fontSize: ["4xl", "3xl"],
      fontWeight: "bold",
      my: "3",
      color: mode("violet.700", "acid.300")(props),
    },
    h2: {
      fontSize: ["2xl", "xl"],
      my: "2",
      fontWeight: "bold",
      color: mode("bg.800", "bg.100")(props),
    },
    h3: {
      fontSize: ["xl", "lg"],
      my: "2",
      fontWeight: "semibold",
      color: mode("bg.600", "acid.300")(props),
    },
    h4: {
      fontSize: ["lg", "md"],
      my: "2",
      color: mode("bg.600", "bg.100")(props),
      fontWeight: "semibold",
    },
    a: {
      color: mode("violet.700", "violet.300")(props),
      _hover: {
        textDecoration: "underline",
      },
    },
    ul: {
      listStyleType: "disc",
      listStylePosition: "outside",
      pl: "6",
      my: "2",
    },
    li: {
      mb: "1",
      lineHeight: "tall",
    },
  }),
};

const theme = extendTheme({
  colors,
  breakpoints,
  config,
  styles,
  shadows,
  fonts,
  components,
});

export default theme;
