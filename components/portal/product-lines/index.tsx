import { Button, SimpleGrid, Text } from "@chakra-ui/react";
import Link from "next/link";
import type { PortalProductLine, PortalSession } from "../../../types/portal";
import { PortalShell } from "../PortalShell";
import { ProductLineCard } from "./ProductLineCard";

export type ProductLinesPageProps = {
  session: PortalSession;
  productLines: PortalProductLine[];
  loadError?: string;
};

export function ProductLinesPage({
  session,
  productLines,
  loadError,
}: ProductLinesPageProps) {
  return (
    <PortalShell
      title="Product lines"
      description="The cups you see on the main screen"
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
export { ProductLineForm } from "./ProductLineForm";
export { SearchableImageSelect } from "./SearchableImageSelect";
export type {
  SearchableImageOption,
  SearchableImageSelectProps,
} from "./SearchableImageSelect";
