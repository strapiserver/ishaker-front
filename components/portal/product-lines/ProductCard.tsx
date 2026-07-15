import {
  Box,
  HStack,
  IconButton,
  Image,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
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
        error instanceof Error ? error.message : "Product could not be deleted.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <Box
      bg="whiteAlpha.50"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="xl"
      minW="0"
      overflow="hidden"
      p="3"
      w="full"
    >
      <HStack spacing="4" align="center">
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
          <HStack spacing="2" justify="flex-end">
            <IconButton
              as={Link}
              href={`/product-lines/${productLineId}/products/new?productId=${product.id}`}
              aria-label={`Edit ${productName}`}
              title="Edit"
              variant="outline"
              icon={<FiEdit2 />}
              colorScheme="gray"
            />
            <IconButton
              aria-label={`Delete ${productName}`}
              title="Delete"
              icon={<FiTrash2 />}
              colorScheme="red"
              variant="outline"
              isLoading={isDeleting}
              onClick={deleteDialog.onOpen}
            />
          </HStack>
        </VStack>
      </HStack>
      <DeleteProductDialog
        isDeleting={isDeleting}
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={deleteProduct}
        productName={productName}
      />
    </Box>
  );
}
