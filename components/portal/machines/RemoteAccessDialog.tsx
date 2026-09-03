import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaAndroid, FaApple } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";
import type { Machine } from "../../../types/strapi";

type RemoteAccessDialogProps = {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
};

const APPLE_DOWNLOAD_URL =
  "https://apps.apple.com/us/app/rustdesk-remote-desktop/id1581225015";
const ANDROID_DOWNLOAD_URL =
  "https://github.com/rustdesk/rustdesk/releases/latest";

function CopyField({ label, value }: { label: string; value?: string | null }) {
  const toast = useToast();
  const displayValue = value || "Not configured";
  const canCopy = Boolean(value);

  const copyValue = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `${label} copied`,
        status: "success",
        duration: 1800,
        isClosable: true,
      });
    } catch {
      toast({
        title: `Could not copy ${label.toLowerCase()}`,
        description: "Select the value and copy it manually.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <FormControl>
      <FormLabel color="bg.300" fontSize="sm" mb="1.5">
        {label}
      </FormLabel>
      <InputGroup>
        <Input
          value={displayValue}
          readOnly
          pr="12"
          bg="bg.800"
          borderColor="whiteAlpha.200"
          color={canCopy ? "bg.50" : "bg.400"}
          fontFamily={canCopy ? "mono" : "inherit"}
          cursor={canCopy ? "copy" : "default"}
          onClick={() => void copyValue()}
          aria-label={`${label}${canCopy ? ", click to copy" : ""}`}
          _hover={canCopy ? { borderColor: "whiteAlpha.400" } : undefined}
        />
        <InputRightElement>
          <IconButton
            aria-label={`Copy ${label.toLowerCase()}`}
            title={`Copy ${label.toLowerCase()}`}
            icon={<Icon as={FiCopy} />}
            variant="ghost"
            size="sm"
            color="bg.200"
            isDisabled={!canCopy}
            onClick={() => void copyValue()}
          />
        </InputRightElement>
      </InputGroup>
    </FormControl>
  );
}

export function RemoteAccessDialog({
  machine,
  isOpen,
  onClose,
}: RemoteAccessDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent bg="bg.900" color="bg.50">
        <ModalHeader pr="12">Access your machine remotely</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <RemoteAccessContent machine={machine} />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function RemoteAccessContent({ machine }: { machine: Machine | null }) {
  return (
    <VStack spacing="5" align="stretch">
      <VStack spacing="3">
        <Image
          src="/rustdesk.png"
          alt="RustDesk"
          width="240px"
          maxW="80%"
          objectFit="contain"
        />
        <Text color="bg.300" fontSize="sm" textAlign="center">
          Download RustDesk, then use the login and password below.
        </Text>
        <HStack spacing="3" width="100%">
          <Button
            as="a"
            href={APPLE_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            colorScheme="purple"
            leftIcon={<Icon as={FaApple} boxSize="5" />}
            flex="1"
          >
            Apple
          </Button>
          <Button
            as="a"
            href={ANDROID_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            colorScheme="green"
            leftIcon={<Icon as={FaAndroid} boxSize="5" />}
            flex="1"
          >
            Android
          </Button>
        </HStack>
      </VStack>

      <VStack spacing="4" align="stretch">
        <Alert
          status="warning"
          bg="yellow.900"
          color="yellow.50"
          borderRadius="md"
          border="1px solid"
          borderColor="yellow.700"
        >
          <AlertIcon color="yellow.300" />
          <Text fontWeight="700">
            Before connecting:
            <br />
            Go to Settings -&gt; Login with Google
          </Text>
        </Alert>
        <CopyField label="ID" value={machine?.rustdesk_id} />
        <CopyField label="Password" value={machine?.rustdesk_password} />
      </VStack>
    </VStack>
  );
}
