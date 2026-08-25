import {
  Box,
  Grid,
  IconButton,
  Image,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { type MouseEvent, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { capitalizeName } from "../../../lib/formatName";
import { getSmallestMediaUrl } from "../../../lib/portal/media";
import type { PortalCup, PortalProduct } from "../../../types/portal";
import { CupThumbnailStack } from "./CupThumbnailStack";
import { DeleteProductDialog } from "./DeleteProductDialog";

type ProductCardProps = {
  product: PortalProduct;
  productLineId: string | number;
  defaultCup?: PortalCup;
};

export function ProductCard({
  product,
  productLineId,
  defaultCup,
}: ProductCardProps) {
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
  const displayCup = product.cup || defaultCup;

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
      router.reload();
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
      <Grid
        templateColumns="minmax(210px,1.45fr) minmax(180px,1.25fr) minmax(90px,.7fr) 90px"
        minH="50px"
        px="5"
        alignItems="center"
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.075)"
        cursor="pointer"
        minW="0"
        opacity={isActive ? 1 : 0.8}
        role="link"
        tabIndex={0}
        w="full"
        _hover={{ bg: "whiteAlpha.50" }}
        transition="background 0.2s ease, opacity 0.2s ease"
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
        <Grid
          templateColumns="10px 38px 1fr"
          gap="3"
          alignItems="center"
          minW="0"
        >
          <Box
            as="button"
            type="button"
            aria-label={`Set ${productName} ${isActive ? "inactive" : "active"}`}
            title={isActive ? "Active" : "Inactive"}
            boxSize="10px"
            borderRadius="full"
            bg={isActive ? "#62e85b" : "whiteAlpha.300"}
            boxShadow={isActive ? "0 0 8px rgba(98,232,91,.45)" : "none"}
            cursor={isUpdatingActive ? "wait" : "pointer"}
            disabled={isUpdatingActive}
            transition="background 0.2s ease, box-shadow 0.2s ease"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              void updateActiveState(!isActive);
            }}
          />
          <Box aria-label={`${productName} preview`} role="img" boxSize="36px">
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
          <Text color="whiteAlpha.900" fontSize="sm" noOfLines={1}>{productName}</Text>
        </Grid>
        <Grid templateColumns={brandImage ? "38px 1fr" : "1fr"} gap="3" alignItems="center" minW="0">
          {brandImage ? <Image src={brandImage} alt={`${brandName} logo`} w="38px" h="28px" objectFit="contain" /> : null}
          <Text color="whiteAlpha.800" fontSize="sm" noOfLines={1}>{brandName || "No brand"}</Text>
        </Grid>
        <CupThumbnailStack cups={displayCup ? [displayCup] : []} />
        <Box onClick={(event) => event.stopPropagation()}>
          <IconButton aria-label={`Edit ${productName}`} icon={<FiEdit2 />} variant="ghost" size="sm" color="whiteAlpha.800" onClick={() => void router.push(`/product-lines/${productLineId}/products/new?productId=${product.id}`)} />
          <IconButton aria-label={`Delete ${productName}`} icon={<FiTrash2 />} variant="ghost" size="sm" color="whiteAlpha.800" isLoading={isDeleting} _hover={{ color: "red.300", bg: "whiteAlpha.100" }} onClick={deleteDialog.onOpen} />
        </Box>
      </Grid>
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
