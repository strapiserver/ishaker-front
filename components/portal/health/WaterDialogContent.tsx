import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Radio,
  RadioGroup,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Machine } from "../../../types/strapi";
import { MAX_WATER_LITERS, WaterBottle } from "./WaterBottle";

export function WaterDialogContent({
  machine,
  onSaved,
}: {
  machine: Machine;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [waterType, setWaterType] = useState<"bottle" | "mains">(
    machine.water_type || "bottle",
  );
  const [amount, setAmount] = useState(() =>
    Math.min(
      MAX_WATER_LITERS,
      Math.max(0, Number(machine.water_amount_liters) || 0),
    ),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/portal/machines/${machine.id}/inventory`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ waterType, waterAmountLiters: amount }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(payload?.message || "Water level could not be saved.");
      toast({
        title: "Water settings saved",
        status: "success",
        duration: 2500,
      });
      onSaved();
    } catch (error) {
      toast({
        title: "Could not save water settings",
        description: (error as Error).message,
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack spacing="6" align="stretch">
      <RadioGroup
        value={waterType}
        onChange={(value) => setWaterType(value as "bottle" | "mains")}
      >
        <HStack spacing="6">
          <Radio value="bottle">Bottle</Radio>
          <Radio value="mains">Water supply</Radio>
        </HStack>
      </RadioGroup>
      {waterType === "mains" ? (
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          Water is shown as infinite for a plumbed machine.
        </Alert>
      ) : (
        <Box textAlign="center">
          <Box mx="auto" w="150px">
            <WaterBottle liters={amount} onChange={setAmount} />
          </Box>
          <Text mt="3" color="bg.400" fontSize="sm">
            Swipe up or down on the bottle to set the water left (maximum{" "}
            {MAX_WATER_LITERS} L).
          </Text>
        </Box>
      )}
      <Button
        variant="primary"
        onClick={() => void save()}
        isLoading={saving}
        alignSelf="end"
      >
        Save water
      </Button>
    </VStack>
  );
}
