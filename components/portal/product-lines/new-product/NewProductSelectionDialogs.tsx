import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Input,
  HStack,
  Alert,
  AlertIcon,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { useState } from "react";
import type { PortalSplash, PortalTaste } from "../../../../types/portal";
import { TestSplash } from "./TestSplash";
import { TestTasteMain } from "./TestTasteMain";

type NewProductSelectionDialogsProps = {
  isMainImageOpen: boolean;
  isMainImageLoading?: boolean;
  isSplashOpen: boolean;
  isSplashLoading?: boolean;
  mainImageError?: boolean;
  mainImageId: string;
  onCloseMainImage: () => void;
  onCloseSplash: () => void;
  onSelectMainImage: (id: string) => void;
  onSelectSplash: (id: string) => void;
  splashId: string;
  splashError?: boolean;
  splashes: PortalSplash[];
  tastes: PortalTaste[];
};

export function NewProductSelectionDialogs({
  isMainImageOpen,
  isMainImageLoading = false,
  isSplashOpen,
  isSplashLoading = false,
  mainImageError = false,
  mainImageId,
  onCloseMainImage,
  onCloseSplash,
  onSelectMainImage,
  onSelectSplash,
  splashId,
  splashError = false,
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
            {isSplashLoading ? (
              <Center py="12"><Spinner color="acid.300" /></Center>
            ) : splashError ? (
              <Alert status="error"><AlertIcon />All splash images could not be loaded.</Alert>
            ) : isSplashOpen ? (
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
            {isMainImageLoading ? (
              <Center py="12"><Spinner color="acid.300" /></Center>
            ) : mainImageError ? (
              <Alert status="error"><AlertIcon />All taste main images could not be loaded.</Alert>
            ) : isMainImageOpen ? (
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
