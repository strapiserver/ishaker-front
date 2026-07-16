import {
  Box,
  HStack,
  IconButton,
  Image,
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
  const main = product.custom_main || product.taste?.main;
  const mainImage = getSmallestMediaUrl(main);
  const productName = capitalizeName(product.name);

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
        overflow="hidden"
        p="3"
        position="relative"
        role="link"
        tabIndex={0}
        w="full"
        _hover={{ borderColor: "whiteAlpha.300" }}
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
        <IconButton
          aria-label={`Delete ${productName}`}
          title="Delete"
          icon={<RxCross2 />}
          color="red.300"
          variant="ghost"
          size="sm"
          position="absolute"
          top="2"
          right="2"
          zIndex="2"
          isLoading={isDeleting}
          _hover={{ bg: "red.900", color: "red.200" }}
          onClick={(event) => {
            event.stopPropagation();
            deleteDialog.onOpen();
          }}
        />
        <HStack spacing="4" align="center" pr="8">
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
