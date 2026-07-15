import {
  Box,
  Button,
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
import type { PortalProductLine } from "../../../types/portal";
import { IoAddOutline } from "react-icons/io5";
import { DeleteProductLineDialog } from "./DeleteProductLineDialog";
type ProductLineCardProps = {
  productLine: PortalProductLine;
};

export function ProductLineCard({ productLine }: ProductLineCardProps) {
  const router = useRouter();
  const deleteDialog = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const cupImage = getSmallestMediaUrl(productLine.cup?.image);
  const firstBrand = productLine.brands?.[0];
  const brandImage = getSmallestMediaUrl(firstBrand?.logo);
  const productLineName = capitalizeName(productLine.name);
  const productCount = productLine.products?.length || 0;

  const deleteProductLine = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/portal/product-lines/${productLine.id}`,
        {
          method: "DELETE",
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message || "Product line could not be deleted.",
        );
      }
      deleteDialog.onClose();
      await router.replace(router.asPath);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Product line could not be deleted.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <Box
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      overflow="hidden"
      p="5"
    >
      <HStack spacing="4" align="center">
        <Box boxSize="120px" flex="0 0 auto" p="2">
          {cupImage ? (
            <Image
              src={cupImage}
              alt={capitalizeName(productLine.cup?.name) || "Cup"}
              w="full"
              h="full"
              objectFit="contain"
            />
          ) : null}
        </Box>
        <VStack spacing="2" minW="0" flex="1" align="stretch">
          <HStack justify="space-between" align="center" spacing="2">
            <Box>
              <Text color="bg.200" fontWeight="700" fontSize="md" noOfLines={2}>
                {`${productLineName} (${productCount})`}
              </Text>
              <Text color="bg.400" fontSize="sm" noOfLines={2}>
                {` ${firstBrand ? capitalizeName(firstBrand.name) : "No brand"}`}
              </Text>
            </Box>
            {brandImage ? (
              <Image
                src={brandImage}
                alt=""
                boxSize="70px"
                objectFit="contain"
                flexShrink={0}
              />
            ) : null}
          </HStack>
          {firstBrand ? (
            <HStack
              spacing="1"
              alignItems="center"
              justifyContent="space-between"
            >
              <Button
                as={Link}
                href={`/product-lines/${productLine.id}/products/new`}
                variant="outline"
                size="sm"
                colorScheme="gray"
                leftIcon={<IoAddOutline size="1rem" />}
              >
                Add product
              </Button>

              <IconButton
                as={Link}
                href={`/product-lines/${productLine.id}/edit`}
                aria-label={`Edit ${productLineName}`}
                title="Edit"
                variant="outline"
                icon={<FiEdit2 />}
                colorScheme="gray"
              />
              <IconButton
                aria-label={`Delete ${productLineName}`}
                title="Delete"
                icon={<FiTrash2 />}
                colorScheme="red"
                variant="outline"
                isLoading={isDeleting}
                onClick={deleteDialog.onOpen}
              />
            </HStack>
          ) : null}
        </VStack>
      </HStack>
      <DeleteProductLineDialog
        isDeleting={isDeleting}
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={deleteProductLine}
        productLineName={productLineName}
      />
    </Box>
  );
}
