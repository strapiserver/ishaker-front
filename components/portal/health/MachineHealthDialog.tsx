import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import type { Machine } from "../../../types/strapi";
import { CupsDialogContent } from "./CupsDialogContent";
import { NayaxDialogContent } from "./NayaxDialogContent";
import { PowdersDialogContent } from "./PowdersDialogContent";
import { WaterDialogContent } from "./WaterDialogContent";
import { WifiDialogContent } from "./WifiDialogContent";

export type HealthDialogKind = "wifi" | "nayax" | "water" | "powders" | "cups";

const titles: Record<HealthDialogKind, string> = {
  wifi: "Machine Wi-Fi",
  nayax: "Nayax payments",
  water: "Water supply",
  powders: "Powder containers",
  cups: "Cup inventory",
};

export function MachineHealthDialog({ kind, machine, onClose, onSaved }: {
  kind: HealthDialogKind | null;
  machine: Machine;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal isOpen={Boolean(kind)} onClose={onClose} isCentered size={kind === "powders" ? "2xl" : "lg"}>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent bg="bg.900" color="bg.50">
        <ModalHeader pr="12">{kind ? titles[kind] : "Machine health"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb="6">
          {kind === "wifi" ? <WifiDialogContent /> : null}
          {kind === "nayax" ? <NayaxDialogContent /> : null}
          {kind === "water" ? <WaterDialogContent machine={machine} onSaved={onSaved} /> : null}
          {kind === "powders" ? <PowdersDialogContent machine={machine} onSaved={onSaved} onClose={onClose} /> : null}
          {kind === "cups" ? <CupsDialogContent machine={machine} onSaved={onSaved} /> : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
