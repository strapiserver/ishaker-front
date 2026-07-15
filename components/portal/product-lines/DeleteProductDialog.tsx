import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useRef } from "react";

type DeleteProductDialogProps = {
  isDeleting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
};

export function DeleteProductDialog({
  isDeleting,
  isOpen,
  onClose,
  onConfirm,
  productName,
}: DeleteProductDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={isDeleting ? () => undefined : onClose}
      isCentered
    >
      <AlertDialogOverlay bg="blackAlpha.700" backdropFilter="blur(6px)">
        <AlertDialogContent
          bg="bg.900"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <AlertDialogHeader color="bg.50" fontSize="xl" fontWeight="800">
            Delete product?
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text color="bg.300">
              <Text as="span" color="bg.50" fontWeight="700">
                {productName}
              </Text>{" "}
              will be removed from this product line.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack spacing="3">
              <Button
                ref={cancelRef}
                onClick={onClose}
                isDisabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={onConfirm}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
