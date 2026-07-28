import {
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Image,
  Switch,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { type KeyboardEvent, useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { capitalizeName } from "../../../lib/formatName";
import { getSmallestMediaUrl } from "../../../lib/portal/media";
import type { PortalProductLine } from "../../../types/portal";
import { IoAddOutline } from "react-icons/io5";
import { DeleteProductLineDialog } from "./DeleteProductLineDialog";
import { ProductCard } from "./ProductCard";
import { Box3D } from "../../../styles/theme/custom";
type ProductLineCardProps = {
  productLine: PortalProductLine;
};

export function ProductLineCard({ productLine }: ProductLineCardProps) {
  const router = useRouter();
  const deleteDialog = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActive, setIsActive] = useState(productLine.isActive !== false);
  const [isUpdatingActive, setIsUpdatingActive] = useState(false);
  const cupImage = getSmallestMediaUrl(productLine.cup?.image);
  const productLineName = capitalizeName(productLine.name);
  const productCount = productLine.products?.length || 0;
  const brandCount = new Set(
    (productLine.products || [])
      .map((product) => product.brand?.id)
      .filter(Boolean)
      .map(String),
  ).size;

  const updateActiveState = async (nextIsActive: boolean) => {
    const previousIsActive = isActive;
    setIsActive(nextIsActive);
    setIsUpdatingActive(true);
    try {
      const response = await fetch(
        `/api/portal/product-lines/${productLine.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: nextIsActive }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message || "Product line status could not be updated.",
        );
      }
    } catch (error) {
      setIsActive(previousIsActive);
      window.alert(
        error instanceof Error
          ? error.message
          : "Product line status could not be updated.",
      );
    } finally {
      setIsUpdatingActive(false);
    }
  };

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
    <>
      <Box3D
        overflow="hidden"
        opacity={isActive ? 1 : 0.8}
        p="5"
        position="relative"
        cursor="pointer"
        role="link"
        tabIndex={0}
        onClick={() =>
          void router.push(`/product-lines/${productLine.id}/edit`)
        }
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (
            event.currentTarget === event.target &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            void router.push(`/product-lines/${productLine.id}/edit`);
          }
        }}
        transition="opacity 0.2s ease"
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
            aria-label={`${isActive ? "Turn off" : "Turn on"} ${productLineName}`}
            colorScheme="green"
            isChecked={isActive}
            isDisabled={isUpdatingActive}
            onChange={(event) => void updateActiveState(event.target.checked)}
          />
          <IconButton
            aria-label={`Delete ${productLineName}`}
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
            boxSize="120px"
            flex="0 0 auto"
            p="4"
            borderRadius="lg"
            bg="bg.800"
          >
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
          <VStack spacing="0" minW="0" flex="1" align="stretch" mt="1">
            <HStack justify="space-between" align="center" spacing="2">
              <Box>
                <Text
                  color="bg.200"
                  fontWeight="700"
                  fontSize="md"
                  noOfLines={2}
                >
                  {`${productLineName} (${productCount})`}
                </Text>
                <Text color="bg.400" fontSize="sm" noOfLines={2}>
                  {brandCount
                    ? `${brandCount} ${brandCount === 1 ? "brand" : "brands"}`
                    : "No brands yet"}
                </Text>
              </Box>
            </HStack>
          </VStack>
        </HStack>
        <Divider my="4" />
        {productLine.products?.length ? (
          <VStack spacing="3" mt="5" align="stretch" w="full">
            {productLine.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                productLineId={productLine.id}
              />
            ))}
          </VStack>
        ) : null}
        <Button
          as={Link}
          href={`/product-lines/${productLine.id}/products/new`}
          variant="outline"
          w="full"
          mt="4"
          border="3px dashed"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          h="50px"
          colorScheme="gray"
          leftIcon={<IoAddOutline size="1rem" />}
          onClick={(event) => event.stopPropagation()}
        >
          Add product
        </Button>
      </Box3D>
      <DeleteProductLineDialog
        isDeleting={isDeleting}
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        onConfirm={deleteProductLine}
        productLineName={productLineName}
      />
    </>
  );
}
