import { VStack } from "@chakra-ui/react";
import type {
  PortalBrand,
  PortalCircle,
  PortalCup,
  PortalMedia,
} from "../../../../types/portal";
import { CupPreview } from "../CupPreview";
import { TasteMainPreview } from "./TasteMainPreview";

type NewProductVisualPreviewProps = {
  brand?: PortalBrand;
  circle?: PortalCircle;
  cup?: PortalCup;
  isSplashLoading: boolean;
  main?: PortalMedia | null;
  productLineName: string;
  splashError: boolean;
  splashFrames: string[];
  splashIsEmpty?: boolean;
};

export function NewProductVisualPreview({
  brand,
  circle,
  cup,
  isSplashLoading,
  main,
  productLineName,
  splashError,
  splashFrames,
  splashIsEmpty,
}: NewProductVisualPreviewProps) {
  return (
    <VStack spacing="6" align="stretch">
      <CupPreview
        brand={brand}
        cup={cup}
        isSplashLoading={isSplashLoading}
        productLineName={productLineName}
        splashError={splashError}
        splashFrames={splashFrames}
        splashIsEmpty={splashIsEmpty}
      />
      <TasteMainPreview circle={circle} main={main} />
    </VStack>
  );
}
