import { ListItem, OrderedList, Text, VStack } from "@chakra-ui/react";
import { SupportArticleLink } from "./SupportArticleLink";

export function WifiDialogContent() {
  return (
    <VStack spacing="5" align="stretch">
      <Text color="bg.300">
        Restarting the machine refreshes both the kiosk app and its network connection.
      </Text>
      <OrderedList spacing="3" pl="2">
        <ListItem>Shut the machine down with its power switch.</ListItem>
        <ListItem>Wait 30 seconds, then switch it back on.</ListItem>
        <ListItem>Open the machine Wi-Fi settings and select your network.</ListItem>
        <ListItem>Enter the Wi-Fi password and wait for the Online status.</ListItem>
      </OrderedList>
      <SupportArticleLink topic="wifi" />
    </VStack>
  );
}
