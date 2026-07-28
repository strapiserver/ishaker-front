import {
  Box,
  HStack,
  IconButton,
  Image,
  Switch,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { capitalizeName } from "../../../lib/formatName";
import { getSmallestMediaUrl } from "../../../lib/portal/media";
import type { PortalProduct } from "../../../types/portal";
import { DeleteProductDialog } from "./DeleteProductDialog";

type ProductCardProps = {
  product: PortalProduct;
  productLineId: string | number;
};

export function ProductCard({ product, productLineId }: ProductCardProps) {
  const router = useRouter();
  const deleteDialog = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActive, setIsActive] = useState(product.isActive !== false);
  const [isUpdatingActive, setIsUpdatingActive] = useState(false);
  const main = product.custom_main || product.taste?.main;
  const mainImage = getSmallestMediaUrl(main);
  const productName = capitalizeName(product.name);
  const brandName = capitalizeName(product.brand?.name);
  const brandImage = getSmallestMediaUrl(product.brand?.logo);

  const updateActiveState = async (nextIsActive: boolean) => {
    const previousIsActive = isActive;
    setIsActive(nextIsActive);
    setIsUpdatingActive(true);
    try {
      const response = await fetch(
        `/api/portal/product-lines/${productLineId}/products/${product.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: nextIsActive }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message || "Product status could not be updated.",
        );
      }
    } catch (error) {
      setIsActive(previousIsActive);
      window.alert(
        error instanceof Error
          ? error.message
          : "Product status could not be updated.",
      );
    } finally {
      setIsUpdatingActive(false);
    }
  };

  const deleteProduct = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/portal/product-lines/${productLineId}/products/${product.id}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Product could not be deleted.");
      }
      deleteDialog.onClose();
      await router.replace(router.asPath);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Product could not be deleted.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Box
        bg="bg.800"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="xl"
        cursor="pointer"
        minW="0"
        opacity={isActive ? 1 : 0.8}
        overflow="hidden"
        p="3"
        position="relative"
        role="link"
        tabIndex={0}
        w="full"
        _hover={{ borderColor: "whiteAlpha.300" }}
        transition="border-color 0.2s ease, opacity 0.2s ease"
        onClick={(event) => {
          event.stopPropagation();
          void router.push(
            `/product-lines/${productLineId}/products/new?productId=${product.id}`,
          );
        }}
        onKeyDown={(event) => {
          if (
            event.currentTarget === event.target &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            event.stopPropagation();
            void router.push(
              `/product-lines/${productLineId}/products/new?productId=${product.id}`,
            );
          }
        }}
      >
        <HStack
          spacing="2"
          position="absolute"
          top="2"
          right="2"
          zIndex="2"
          onClick={(event) => event.stopPropagation()}
        >
          <Switch
            aria-label={`${isActive ? "Turn off" : "Turn on"} ${productName}`}
            colorScheme="green"
            isChecked={isActive}
            isDisabled={isUpdatingActive}
            onChange={(event) => void updateActiveState(event.target.checked)}
          />
          <IconButton
            aria-label={`Delete ${productName}`}
            title="Delete"
            icon={<RxCross2 />}
            color="red.300"
            variant="ghost"
            size="sm"
            isLoading={isDeleting}
            _hover={{ bg: "red.900", color: "red.200" }}
            onClick={() => deleteDialog.onOpen()}
          />
        </HStack>
        <HStack spacing="4" align="center" pr="20">
          <Box
            aria-label={`${productName} preview`}
            role="img"
            position="relative"
            flex="0 0 auto"
            boxSize={{ base: "82px", sm: "96px" }}
          >
            {mainImage ? (
              <Image
                src={mainImage}
                alt={productName}
                position="relative"
                w="full"
                h="full"
                objectFit="contain"
              />
            ) : (
              <Box
                h="full"
                display="grid"
                placeItems="center"
                color="bg.500"
                fontSize="xs"
                textAlign="center"
              >
                No preview
              </Box>
            )}
          </Box>
          <VStack minW="0" flex="1" align="stretch" spacing="3">
            <Text color="bg.200" fontSize="sm" fontWeight="700" noOfLines={2}>
              {productName}
            </Text>
            <HStack spacing="3">
              {brandImage ? (
                <Image
                  src={brandImage}
                  alt={`${brandName} logo`}
                  boxSize={{ base: "40px", sm: "48px" }}
                  objectFit="contain"
                  flex="0 0 auto"
                />
              ) : null}
              <Text
                color="bg.300"
                fontSize={{ base: "sm", sm: "md" }}
                fontWeight="600"
                noOfLines={1}
              >
                {brandName || "No brand"}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>
      <DeleteProductDialog
        isDeleting={isDeleting}
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={deleteProduct}
        productName={productName}
      />
    </>
  );
}
