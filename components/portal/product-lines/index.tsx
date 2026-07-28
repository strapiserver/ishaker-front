import { Box, Button, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import Link from "next/link";
import type {
  PortalProduct,
  PortalProductLine,
  PortalSession,
} from "../../../types/portal";
import { PortalShell } from "../PortalShell";
import { OrphanProductCard } from "./OrphanProductCard";
import { ProductLineCard } from "./ProductLineCard";

export type ProductLinesPageProps = {
  session: PortalSession;
  productLines: PortalProductLine[];
  orphanProducts: PortalProduct[];
  loadError?: string;
};

export function ProductLinesPage({
  session,
  productLines,
  orphanProducts,
  loadError,
}: ProductLinesPageProps) {
  return (
    <PortalShell
      title="Product lines"
      description="Your drink and flavour library. Assign flavours to physical containers from a machine or preset."
      clientName={session.client.company}
      access={session.access}
    >
      <Button
        as={Link}
        href="/product-lines/new"
        variant="primary"
        size="lg"
        mb="8"
      >
        + New product line
      </Button>

      {loadError ? (
        <Text color="orange.200" mb="5">
          {loadError}
        </Text>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="5">
        {productLines.map((productLine) => (
          <ProductLineCard key={productLine.id} productLine={productLine} />
        ))}
      </SimpleGrid>

      {!productLines.length && !loadError ? (
        <Text color="bg.300">No product lines are available yet.</Text>
      ) : null}

      {orphanProducts.length ? (
        <Box mt="10">
          <Heading as="h2" fontSize="xl" mb="2">
            Orphan products
          </Heading>
          <Text color="orange.200" mb="4">
            Legacy flavours detached by the old edit flow. Attach one to recover
            it, or delete it when no machine or preset container uses it. This
            section disappears when no orphan products remain.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="4">
            {orphanProducts.map((product) => (
              <OrphanProductCard
                key={product.id}
                product={product}
                productLines={productLines}
              />
            ))}
          </SimpleGrid>
        </Box>
      ) : null}
    </PortalShell>
  );
}

export { CupPreview } from "./CupPreview";
export { DeleteProductDialog } from "./DeleteProductDialog";
export { DeleteProductLineDialog } from "./DeleteProductLineDialog";
export { NewProductPage } from "./new-product";
export type { NewProductPageProps } from "./new-product";
export { NewProductLinePage } from "./NewProductLinePage";
export type { NewProductLinePageProps } from "./NewProductLinePage";
export { ProductLineCard } from "./ProductLineCard";
export { ProductCard } from "./ProductCard";
export { OrphanProductCard } from "./OrphanProductCard";
export { ProductLineForm } from "./ProductLineForm";
export { SearchableImageSelect } from "./SearchableImageSelect";
export type {
  SearchableImageOption,
  SearchableImageSelectProps,
} from "./SearchableImageSelect";
