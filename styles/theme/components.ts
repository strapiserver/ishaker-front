import { mode } from "@chakra-ui/theme-tools";
import { ITone } from "../../types/shared";
import { colors3D } from "./colors";

const colorNameToHex = (theme: any, colorFullName: string) => {
  const [colorName, colorNumber] = colorFullName.split(".");
  const colorScale = theme.colors[colorName] as Record<string, string>;

  return colorScale?.[colorNumber] || "#fcb597";
};

const createGradient = (theme: any, tone: ITone, glowing = false) => {
  const [bgFrom, bgTo, borderFrom, borderTo, whiteAlpha, shadeTo] =
    colors3D[tone];

  const bgFromHex = colorNameToHex(theme, bgFrom);
  const bgToHex = colorNameToHex(theme, bgTo);
  const borderFromHex = colorNameToHex(theme, borderFrom);
  const borderToHex = colorNameToHex(theme, borderTo);
  const shadeFromHex = colorNameToHex(theme, whiteAlpha);
  const shadeToHex = colorNameToHex(theme, shadeTo);
  const glowingShadow = `-2px -2px 15px -8px ${shadeFromHex}, 2px 2px 15px -8px ${shadeToHex}`;
  const regularShadow = `-2px -2px 5px ${shadeFromHex}, 2px 2px 5px ${shadeToHex}`;

  return {
    color: glowing ? "bg.800" : "bg.100",
    border: "1px solid",
    borderColor: "transparent",
    boxShadow: glowing ? glowingShadow : regularShadow,
    background: `linear-gradient(150deg, ${bgFromHex}, ${bgToHex}) padding-box,
    linear-gradient(150deg, ${borderFromHex}, ${borderToHex}) border-box`,
  };
};

const toastToneMap: Record<string, ITone> = {
  success: "acid",
  error: "error",
  warning: "gray",
  info: "violet",
};

const getToastTone = (status?: string): ITone => {
  return toastToneMap[status ?? "info"] || "shaded";
};

const components: Record<string, any> = {
  Alert: {
    baseStyle: (props: any) => {
      const gradient = createGradient(
        props.theme,
        getToastTone(props.status),
        true,
      );

      return {
        container: {
          ...gradient,
          color: mode("bg.900", "bg.50")(props),
          borderRadius: "xl",
          px: 4,
          py: 3,
        },
        title: {
          fontWeight: "600",
        },
        description: {
          color: mode("bg.700", "bg.100")(props),
        },
        icon: {
          color: mode("bg.900", "bg.50")(props),
        },
      };
    },
  },
  Toast: {
    baseStyle: (props: any) => {
      const gradient = createGradient(
        props.theme,
        getToastTone(props.status),
        true,
      );

      return {
        container: {
          ...gradient,
          color: mode("bg.900", "bg.50")(props),
          borderRadius: "xl",
          px: 4,
          py: 3,
        },
        title: {
          fontWeight: "600",
        },
        description: {
          color: mode("bg.700", "bg.100")(props),
        },
        icon: {
          color: mode("bg.900", "bg.50")(props),
        },
      };
    },
  },
  IconButton: {
    variants: {
      primary_bright: (props: any) => ({
        bgGradient: mode(
          "linear(to-br, acid.100, acid.300)",
          "linear(to-br, bg.300, bg.400)",
        )(props),
      }),
      primary_regular: (props: any) => ({
        bgGradient: mode(
          "linear(to-br, acid.300, acid.400)",
          "linear(to-br, bg.400, bg.500)",
        )(props),
      }),
    },
  },
  Text: {
    variants: {
      no_contrast: (props: any) => ({
        color: mode("bg.600", "bg.400")(props),
      }),
      contrast: (props: any) => ({
        color: mode("bg.800", "bg.200")(props),
      }),
      extra_contrast: (props: any) => ({
        color: mode("bg.1000", "bg.50")(props),
      }),
      primary: (props: any) => ({
        color: mode("violet.700", "acid.300")(props),
      }),
      shaded: (props: any) => ({
        color: mode("bg.500", "bg.500")(props),
      }),
      red: (props: any) => ({
        color: mode("red.700", "red.300")(props),
      }),
      green: (props: any) => ({
        color: mode("green.700", "green.300")(props),
      }),
    },
  },
  Button: {
    baseStyle: {
      filter: "none",
      minH: "10",
      borderRadius: "xl",
      transition: "0.2s filter ease-in",
      _hover: {
        filter: "brightness(1.2)",
      },
      _active: {
        filter: "brightness(0.9)",
      },
    },
    variants: {
      error: ({ theme }: any) => createGradient(theme, "error", true),
      primary: ({ theme, colorMode }: any) =>
        colorMode === "light"
          ? createGradient(theme, "violet", true)
          : createGradient(theme, "acid", true),
      no_contrast: ({ theme, colorMode }: any) =>
        colorMode === "light"
          ? createGradient(theme, "gray", true)
          : createGradient(theme, "shaded"),
      contrast: ({ theme, colorMode }: any) =>
        colorMode === "light"
          ? createGradient(theme, "light", true)
          : createGradient(theme, "dark"),
      extra_contrast: ({ theme, colorMode }: any) =>
        colorMode === "light"
          ? createGradient(theme, "white", true)
          : createGradient(theme, "black"),
      shaded: ({ theme }: any) => createGradient(theme, "shaded"),
      dark: ({ theme }: any) => createGradient(theme, "dark"),
      black: ({ theme }: any) => createGradient(theme, "black"),
      gray: ({ theme }: any) => createGradient(theme, "gray", true),
      light: ({ theme }: any) => createGradient(theme, "light", true),
      white: ({ theme }: any) => createGradient(theme, "white", true),
      default: () => ({}),
    },
  },
};

export default components;
