import {
  Box,
  Button,
  Grid,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FiMoreVertical, FiPower, FiTrash2 } from "react-icons/fi";
import { capitalizeName } from "../../../lib/formatName";
import type { PortalProductLine } from "../../../types/portal";
import { FiPlus } from "react-icons/fi";
import { DeleteProductLineDialog } from "./DeleteProductLineDialog";
import { ProductCard } from "./ProductCard";
type ProductLineCardProps = {
  productLine: PortalProductLine;
};

export function ProductLineCard({ productLine }: ProductLineCardProps) {
  const router = useRouter();
  const deleteDialog = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActive, setIsActive] = useState(productLine.isActive !== false);
  const [isUpdatingActive, setIsUpdatingActive] = useState(false);
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
      <Box
        overflow="hidden"
        bg="rgba(255,255,255,0.025)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.12)"
        borderRadius="12px"
        opacity={isActive ? 1 : 0.8}
        position="relative"
        transition="opacity 0.2s ease"
      >
        <HStack minH="48px" px={{ base: "4", md: "5" }} justify="space-between" borderBottom="1px solid" borderColor="rgba(255,255,255,0.09)">
          <HStack spacing="3">
            <Box boxSize="10px" borderRadius="full" bg={isActive ? "#62e85b" : "whiteAlpha.300"} boxShadow={isActive ? "0 0 10px rgba(98,232,91,.5)" : "none"} />
            <Text color="white" fontWeight="700" fontSize="md">{`${productLineName} (${productCount})`}</Text>
            <Text color={isActive ? "#6ce864" : "whiteAlpha.500"} fontSize="xs">•&nbsp; {isActive ? "Active" : "Inactive"}</Text>
          </HStack>
          <HStack spacing="4">
            <Text color="whiteAlpha.600" fontSize="xs">{brandCount} {brandCount === 1 ? "brand" : "brands"}</Text>
            <Menu>
              <MenuButton as={IconButton} aria-label={`Actions for ${productLineName}`} icon={<FiMoreVertical />} variant="ghost" size="sm" color="whiteAlpha.800" />
              <MenuList bg="#171b1c" borderColor="whiteAlpha.200" minW="190px">
                <MenuItem icon={<FiPower />} bg="transparent" _hover={{ bg: "whiteAlpha.100" }} isDisabled={isUpdatingActive} onClick={() => void updateActiveState(!isActive)}>{isActive ? "Set inactive" : "Set active"}</MenuItem>
                <MenuItem icon={<FiTrash2 />} bg="transparent" color="red.300" _hover={{ bg: "whiteAlpha.100" }} onClick={deleteDialog.onOpen}>Delete product line</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>
        <Box overflowX="auto">
          <Grid templateColumns="minmax(210px,1.45fr) minmax(180px,1.25fr) minmax(90px,.7fr) 90px" minW="680px" px="5" h="37px" alignItems="center" borderBottom="1px solid" borderColor="rgba(255,255,255,0.08)">
            {['PRODUCT', 'BRAND', 'STATUS', 'ACTIONS'].map((label) => <Text key={label} color="whiteAlpha.500" fontSize="10px">{label}</Text>)}
          </Grid>
        {productLine.products?.length ? (
          <Box minW="680px">
            {productLine.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                productLineId={productLine.id}
              />
            ))}
          </Box>
        ) : null}
          <Button as={Link} href={`/product-lines/${productLine.id}/products/new`} variant="ghost" justifyContent="flex-start" minW="680px" w="full" h="46px" px="5" borderRadius="0" color="#65df5c" fontSize="sm" fontWeight="500" leftIcon={<FiPlus />} _hover={{ bg: "whiteAlpha.50" }}>Add product</Button>
        </Box>
      </Box>
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
