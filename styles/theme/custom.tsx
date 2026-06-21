import { Box, Button, Text, useColorModeValue } from "@chakra-ui/react";
import { ReactElement } from "react";
import { ITextVariant, IVariant } from "../../types/shared";

export const CustomBox3D = (props: any) => {
  const { children, ...chakraProps }: { children: ReactElement } = props;

  return (
    <Box3D w="100%" py="4" px="2" {...chakraProps}>
      {children}
    </Box3D>
  );
};

export const RegularBox = (props: any) => {
  const {
    children,
    variant = "extra_contrast",
    ...chakraProps
  }: { children: ReactElement; variant: IVariant } = props;
  const bgVariants = {
    no_contrast: useColorModeValue("bg.100", "bg.700"),
    contrast: useColorModeValue("bg.50", "bg.800"),
    extra_contrast: useColorModeValue("bg.10", "bg.900"),
    primary: useColorModeValue("violet.300", "peach.500"),
  };
  const color = useColorModeValue("bg.700", "bg.100");

  return (
    <Box
      borderRadius="2xl"
      position="relative"
      bgColor={bgVariants[variant]}
      color={props.color || color}
      {...chakraProps}
    >
      {children}
    </Box>
  );
};

export const Box3D = (props: any) => {
  const { children, ...chakraProps }: { children: ReactElement } = props;

  return (
    <RegularBox
      border="none"
      boxShadow={`
        inset 0 0 0 1px rgba(200,200,200,0.1),
        inset -2px -2px 5px rgba(200,200,200,0.05),
        inset 2px 2px 5px rgba(0,0,0,0.15),
        3px 3px 10px -5px rgba(0,0,0,0.5),
        -3px -3px 10px -5px rgba(200,200,200,0.2)
      `}
      {...chakraProps}
    >
      {children}
    </RegularBox>
  );
};

export const ShadedButton = (props: any) => {
  const { children, ...chakraProps }: { children: ReactElement } = props;

  return (
    <Box
      transition="all .3s ease"
      cursor="pointer"
      bgColor="rgba(200,200,200,0.05)"
      _hover={{
        color: useColorModeValue("violet.800", "peach.100"),
        bgColor: "transparent",
      }}
      _active={{
        color: useColorModeValue("violet.700", "peach.400"),
      }}
      borderRadius="2xl"
      {...chakraProps}
    >
      {children}
    </Box>
  );
};

export const ResponsiveText = (props: any) => {
  const {
    children,
    size = "md",
    variant,
    ...chakraProps
  }: {
    children: ReactElement;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
    variant: ITextVariant;
  } = props;
  const sizes = {
    xs: ["0.65rem", "0.65rem", "xs", "sm"],
    sm: ["xs", "xs", "sm", "md"],
    md: ["sm", "sm", "md", "lg"],
    lg: ["md", "md", "lg", "xl"],
    xl: ["lg", "lg", "xl", "2xl"],
    "2xl": ["xl", "xl", "2xl", "3xl"],
    "3xl": ["2xl", "2xl", "3xl", "4xl"],
  };
  const variants = {
    xs: "no_contrast",
    sm: "contrast",
    md: "contrast",
    lg: "extra_contrast",
    xl: "extra_contrast",
    "2xl": "extra_contrast",
    "3xl": "extra_contrast",
  };

  return (
    <Text
      whiteSpace="nowrap"
      fontSize={sizes[size]}
      fontFamily={/\d/.test(size) ? `"Montserrat Alternates", sans-serif` : "unset"}
      variant={variant || variants[size]}
      {...chakraProps}
    >
      {children}
    </Text>
  );
};

export const ResponsiveButton = (props: any) => {
  const { children, ...chakraProps }: { children: ReactElement; size?: string } =
    props;

  return (
    <Button
      size={["xs", "sm", "md", "lg"]}
      px={["0.5", "1", "2"]}
      py={["0", "0.5", "1"]}
      {...chakraProps}
    >
      {children}
    </Button>
  );
};
