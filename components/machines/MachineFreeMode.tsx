import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightAddon,
  Skeleton,
  Spacer,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type FreeModeState,
  type FreeModeWriteResponse,
  parseFreeModeMinutes,
} from "../../lib/freeMode";

type FreeModeResponse = {
  id: string | number;
  state: FreeModeState;
};

const countdownLabel = (seconds: number) => {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainder = wholeSeconds % 60;
  const minuteLabel = String(minutes).padStart(2, "0");
  const secondLabel = String(remainder).padStart(2, "0");
  return hours
    ? `${hours}:${minuteLabel}:${secondLabel}`
    : `${minuteLabel}:${secondLabel}`;
};

export function MachineFreeMode({
  machineId,
  apiScope,
}: {
  machineId: string | number;
  apiScope: "portal" | "admin";
}) {
  const endpoint = `/api/${apiScope}/machines/${encodeURIComponent(
    machineId,
  )}/free-mode`;
  const [state, setState] = useState<FreeModeState | null>(null);
  const [syncedAt, setSyncedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [enabled, setEnabled] = useState(false);
  const [minutes, setMinutes] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showApplyDelay, setShowApplyDelay] = useState(false);

  const applyState = useCallback((nextState: FreeModeState) => {
    setState(nextState);
    setEnabled(nextState.enabled);
    setMinutes(String(nextState.minutes));
    const receivedAt = Date.now();
    setSyncedAt(receivedAt);
    setNow(receivedAt);
  }, []);

  const load = useCallback(
    async (initial = false) => {
      if (initial) setIsLoading(true);
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.state) {
          throw new Error("Free mode status could not be loaded.");
        }
        applyState((body as FreeModeResponse).state);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Free mode status could not be loaded.",
        );
      } finally {
        if (initial) setIsLoading(false);
      }
    },
    [applyState, endpoint],
  );

  useEffect(() => {
    void load(true);
    const refreshInterval = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(refreshInterval);
  }, [load]);

  useEffect(() => {
    const clockInterval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(clockInterval);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (
      !state?.enabled ||
      state.minutes === 0 ||
      state.remainingSeconds === null
    ) {
      return null;
    }
    return Math.max(
      0,
      state.remainingSeconds - Math.floor((now - syncedAt) / 1000),
    );
  }, [now, state, syncedAt]);

  useEffect(() => {
    if (!state?.enabled || state.minutes === 0 || remainingSeconds !== 0)
      return;
    setState((current) =>
      current ? { ...current, enabled: false, expired: true } : current,
    );
    setEnabled(false);
  }, [remainingSeconds, state?.enabled, state?.minutes]);

  const parsedMinutes = parseFreeModeMinutes(minutes);
  const minutesInvalid = parsedMinutes === null;
  const isDirty = Boolean(
    state &&
    (enabled !== state.enabled ||
      (parsedMinutes !== null && parsedMinutes !== state.minutes)),
  );

  const save = async () => {
    if (!state || parsedMinutes === null) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enabled,
          minutes: parsedMinutes,
          base_rev: state.rev,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.state) {
        throw new Error(
          body?.error === "bad_minutes"
            ? "Minutes must be a whole number from 0 to 3,600."
            : "Free mode could not be saved.",
        );
      }

      const result = body as FreeModeWriteResponse;
      applyState(result.state);
      if (!result.accepted) {
        setError(
          "Free mode was changed elsewhere. The current machine setting is shown.",
        );
        return;
      }

      setShowApplyDelay(true);
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Free mode could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const currentlyEnabled = Boolean(
    state?.enabled && (state.minutes === 0 || remainingSeconds !== 0),
  );

  return (
    <Box
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "6" }}
    >
      <VStack align="stretch" spacing="4">
        <HStack spacing="3">
          <Box>
            <Text color="acid.300" fontWeight="800" fontSize="lg">
              Free mode
            </Text>
            <Text color="bg.300" fontSize="sm">
              Temporarily make every drink free on this machine.
            </Text>
          </Box>
          <Spacer />
          {state ? (
            <Badge colorScheme={currentlyEnabled ? "green" : "gray"}>
              {currentlyEnabled ? "On" : "Off"}
            </Badge>
          ) : null}
        </HStack>

        {isLoading && !state ? (
          <VStack align="stretch" spacing="3">
            <Skeleton h="24px" />
            <Skeleton h="64px" />
          </VStack>
        ) : (
          <>
            <FormControl isInvalid={minutesInvalid} maxW="280px">
              <HStack>
                <InputGroup>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={3600}
                    step={1}
                    value={minutes}
                    isDisabled={isSaving || !state}
                    onChange={(event) => setMinutes(event.target.value)}
                  />
                  <InputRightAddon>MIN</InputRightAddon>
                </InputGroup>

                <Switch
                  colorScheme="green"
                  size="lg"
                  isChecked={enabled}
                  isDisabled={isSaving || !state}
                  onChange={(event) => setEnabled(event.target.checked)}
                  aria-label="Enable free mode"
                />
              </HStack>

              {minutesInvalid ? (
                <FormErrorMessage>
                  Enter a whole number from 0 to 3,600.
                </FormErrorMessage>
              ) : (
                <FormHelperText color="bg.400">0 = forever</FormHelperText>
              )}
            </FormControl>

            {state ? (
              <VStack align="stretch" spacing="1">
                {currentlyEnabled ? (
                  <Text color="green.200" fontWeight="700">
                    {state.minutes === 0
                      ? "No time limit"
                      : `Ends in ${countdownLabel(remainingSeconds || 0)}`}
                  </Text>
                ) : null}
                {state.source ? (
                  <Text color="bg.400" fontSize="sm">
                    {state.source === "machine"
                      ? "Set from the kiosk"
                      : "Set from the portal"}
                  </Text>
                ) : null}
              </VStack>
            ) : null}

            <Button
              variant="primary"
              alignSelf="start"
              isLoading={isSaving}
              isDisabled={!state || minutesInvalid || !isDirty}
              onClick={() => void save()}
            >
              Save free mode
            </Button>
          </>
        )}

        {error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : null}
        {showApplyDelay ? (
          <Alert status="info">
            <AlertIcon />
            Applies on the machine within ~5 minutes
          </Alert>
        ) : null}
        <Text color="orange.200" fontSize="sm">
          While free mode is enabled, all drinks are free and sales are recorded
          with a zero amount.
        </Text>
      </VStack>
    </Box>
  );
}
