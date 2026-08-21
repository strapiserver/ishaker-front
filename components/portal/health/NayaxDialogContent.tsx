import { Alert, AlertIcon, Text, VStack } from "@chakra-ui/react";
import { SupportArticleLink } from "./SupportArticleLink";

export function NayaxDialogContent() {
  return (
    <VStack spacing="5" align="stretch">
      <Text color="bg.300">
        Nayax can authorize supported offline transactions when its terminal has connectivity even if the machine Wi-Fi is unavailable. The machine records the vend locally and synchronizes status when its connection returns.
      </Text>
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        Offline payment availability depends on the terminal configuration and your Nayax account.
      </Alert>
      <SupportArticleLink topic="nayax" />
    </VStack>
  );
}
