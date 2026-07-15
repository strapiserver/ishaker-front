import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Input,
  HStack,
} from "@chakra-ui/react";
import { useState } from "react";
import type { PortalSplash, PortalTaste } from "../../../../types/portal";
import { TestSplash } from "./TestSplash";
import { TestTasteMain } from "./TestTasteMain";

type NewProductSelectionDialogsProps = {
  isMainImageOpen: boolean;
  isSplashOpen: boolean;
  mainImageId: string;
  onCloseMainImage: () => void;
  onCloseSplash: () => void;
  onSelectMainImage: (id: string) => void;
  onSelectSplash: (id: string) => void;
  splashId: string;
  splashes: PortalSplash[];
  tastes: PortalTaste[];
};

export function NewProductSelectionDialogs({
  isMainImageOpen,
  isSplashOpen,
  mainImageId,
  onCloseMainImage,
  onCloseSplash,
  onSelectMainImage,
  onSelectSplash,
  splashId,
  splashes,
  tastes,
}: NewProductSelectionDialogsProps) {
  const [splashQuery, setSplashQuery] = useState("");
  const [tasteQuery, setTasteQuery] = useState("");
  const normalizedSplashQuery = splashQuery.trim().toLocaleLowerCase();
  const normalizedTasteQuery = tasteQuery.trim().toLocaleLowerCase();
  const filteredSplashes = normalizedSplashQuery
    ? splashes.filter((splash) =>
        splash.name.toLocaleLowerCase().includes(normalizedSplashQuery),
      )
    : splashes;
  const filteredTastes = normalizedTasteQuery
    ? tastes.filter((taste) =>
        taste.name.toLocaleLowerCase().includes(normalizedTasteQuery),
      )
    : tastes;
  const closeSplash = () => {
    setSplashQuery("");
    onCloseSplash();
  };
  const closeMainImage = () => {
    setTasteQuery("");
    onCloseMainImage();
  };

  return (
    <>
      <Modal isOpen={isSplashOpen} onClose={closeSplash} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg="bg.800">
          <ModalHeader color="bg.50" pr="12">
            <HStack spacing="4" w="full">
              <span style={{ flexShrink: 0 }}>Splash preview</span>
              <Input
                aria-label="Search splashes"
                value={splashQuery}
                onChange={(event) => setSplashQuery(event.target.value)}
                placeholder="Search splashes"
                size="sm"
                h="36px"
                w={{ base: "70%", md: "50%" }}
                bg="bg.900"
              />
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            {isSplashOpen ? (
              <TestSplash
                splashes={filteredSplashes}
                selectedSplashId={splashId}
                onSelect={(id) => {
                  setSplashQuery("");
                  onSelectSplash(id);
                }}
              />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isMainImageOpen} onClose={closeMainImage} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg="bg.800">
          <ModalHeader color="bg.50" pr="12">
            <HStack spacing="4" w="full">
              <span style={{ flexShrink: 0 }}>Tastes preview</span>
              <Input
                aria-label="Search tastes"
                value={tasteQuery}
                onChange={(event) => setTasteQuery(event.target.value)}
                placeholder="Search tastes"
                size="sm"
                h="36px"
                w={{ base: "70%", md: "50%" }}
                bg="bg.900"
              />
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="6">
            {isMainImageOpen ? (
              <TestTasteMain
                tastes={filteredTastes}
                selectedMainImageId={mainImageId}
                onSelect={(id) => {
                  setTasteQuery("");
                  onSelectMainImage(id);
                }}
              />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
