import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Machine } from "../../../types/strapi";

export function WaterDialogContent({ machine, onSaved }: { machine: Machine; onSaved: () => void }) {
  const toast = useToast();
  const [waterType, setWaterType] = useState<"bottle" | "mains">(machine.water_type || "bottle");
  const [amount, setAmount] = useState(Number(machine.water_amount_liters) || 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/portal/machines/${machine.id}/inventory`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ waterType, waterAmountLiters: amount }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Water level could not be saved.");
      toast({ title: "Water settings saved", status: "success", duration: 2500 });
      onSaved();
    } catch (error) {
      toast({ title: "Could not save water settings", description: (error as Error).message, status: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack spacing="6" align="stretch">
      <RadioGroup value={waterType} onChange={(value) => setWaterType(value as "bottle" | "mains")}>
        <HStack spacing="6"><Radio value="bottle">Bottle</Radio><Radio value="mains">Water supply</Radio></HStack>
      </RadioGroup>
      {waterType === "mains" ? (
        <Alert status="success" borderRadius="md"><AlertIcon />Water is shown as infinite for a plumbed machine.</Alert>
      ) : (
        <Box px="2" pt="7" pb="2">
          <Slider value={amount} min={0} max={25} step={0.5} onChange={setAmount} aria-label="Water amount in liters">
            <SliderMark value={amount} mt="-9" ml="-6" fontWeight="800">{amount.toFixed(1)} L</SliderMark>
            <SliderTrack bg="whiteAlpha.200"><SliderFilledTrack bg="blue.400" /></SliderTrack>
            <SliderThumb boxSize="5" />
          </Slider>
          <Text mt="4" color="bg.400" fontSize="sm">Slide to the amount currently left in the bottle.</Text>
        </Box>
      )}
      <Button variant="primary" onClick={() => void save()} isLoading={saving} alignSelf="start">Save water</Button>
    </VStack>
  );
}
