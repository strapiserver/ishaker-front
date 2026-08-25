import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Collapse,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
} from "@chakra-ui/react";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Currency,
  Language,
  Machine,
  TranslationSet,
} from "../../../types/strapi";

type EditableTranslation = {
  id: string | number;
  key: string;
  namespace?: string | null;
  file?: string | null;
  usage?: string | null;
  default_value?: string | null;
  root_value: string;
};

type KioskTextsPayload = {
  language: Language | null;
  translation_set: TranslationSet | null;
  root_set: TranslationSet | null;
  language_mismatch: boolean;
  translations: EditableTranslation[];
  entries: Array<{
    id: string | number;
    translation_id: string | number;
    value: string;
  }>;
};

const valuesFrom = (payload: KioskTextsPayload) => {
  const overrides = new Map(
    payload.entries.map((entry) => [String(entry.translation_id), entry.value]),
  );
  return Object.fromEntries(
    payload.translations.map((translation) => [
      String(translation.id),
      overrides.get(String(translation.id)) ?? translation.root_value,
    ]),
  ) as Record<string, string>;
};

const TEXT_MESH_PRO_MARKUP =
  /<\/?(b|i|u|s|color|style|size|alpha|font|sprite|voffset)\b[^>]*>|\{\d+\}/;

export function MachineKioskTexts({
  machine,
  languages,
  currencies,
}: {
  machine: Machine;
  languages: Language[];
  currencies: Currency[];
}) {
  const toast = useToast();
  const [data, setData] = useState<KioskTextsPayload | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const [languageId, setLanguageId] = useState(
    machine.language?.id ? String(machine.language.id) : "",
  );
  const [currencyId, setCurrencyId] = useState(
    machine.currency?.id ? String(machine.currency.id) : "",
  );
  const [savedCurrencyId, setSavedCurrencyId] = useState(
    machine.currency?.id ? String(machine.currency.id) : "",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [areTranslationsExpanded, setAreTranslationsExpanded] =
    useState(false);
  const [resetIds, setResetIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");

  const applyPayload = useCallback((payload: KioskTextsPayload) => {
    const nextValues = valuesFrom(payload);
    setData(payload);
    setValues(nextValues);
    setSavedValues(nextValues);
    setResetIds(new Set());
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/machines/${encodeURIComponent(machine.id)}/kiosk-texts`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Kiosk texts could not be loaded.");
      }
      applyPayload(payload as KioskTextsPayload);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Kiosk texts could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyPayload, machine.id, machine.language?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirtyIds = useMemo(
    () =>
      new Set(
        (data?.translations || [])
          .filter(
            (translation) =>
              (values[String(translation.id)] || "") !==
              (savedValues[String(translation.id)] || ""),
          )
          .map((translation) => String(translation.id)),
      ),
    [data?.translations, savedValues, values],
  );

  const overriddenIds = useMemo(
    () =>
      new Set(
        (data?.entries || []).map((entry) => String(entry.translation_id)),
      ),
    [data?.entries],
  );

  const languageChanged =
    Boolean(languageId) && String(data?.language?.id || "") !== languageId;
  const currencyChanged =
    Boolean(currencyId) && savedCurrencyId !== currencyId;

  const pendingIds = useMemo(
    () => new Set([...dirtyIds, ...resetIds]),
    [dirtyIds, resetIds],
  );

  const filtered = useMemo(() => {
    return (data?.translations || []).filter((translation) => {
      const savedOverride = data?.entries.find(
        (entry) => String(entry.translation_id) === String(translation.id),
      )?.value;
      return ![
        translation.default_value,
        translation.root_value,
        savedOverride,
      ].some((value) => TEXT_MESH_PRO_MARKUP.test(String(value || "")));
    });
  }, [data?.entries, data?.translations]);

  const customize = async () => {
    setIsCreating(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/machines/${encodeURIComponent(machine.id)}/kiosk-texts`,
        { method: "POST" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message || "A custom text pack could not be created.",
        );
      }
      applyPayload(payload as KioskTextsPayload);
      toast({ title: "Custom kiosk texts enabled", status: "success" });
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "A custom text pack could not be created.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const saveAllChanges = async () => {
    const ids = Array.from(pendingIds);
    if (!ids.length && !languageChanged && !currencyChanged) return;

    setIsSaving(true);
    setError("");
    try {
      let textPayload: KioskTextsPayload | null = null;
      if (ids.length) {
        const response = await fetch(
          `/api/portal/machines/${encodeURIComponent(machine.id)}/kiosk-texts`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              changes: ids.map((translationId) => ({
                translationId: Number(translationId),
                value: resetIds.has(translationId)
                  ? ""
                  : values[translationId] ?? "",
              })),
            }),
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            payload?.message || "Kiosk texts could not be saved.",
          );
        }
        textPayload = payload as KioskTextsPayload;
      }

      if (languageChanged || currencyChanged) {
        const response = await fetch(`/api/portal/machines/${machine.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...(languageChanged ? { languageId } : {}),
            ...(currencyChanged ? { currencyId } : {}),
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            payload?.message || "Machine language could not be saved.",
          );
        }
        if (currencyChanged) setSavedCurrencyId(currencyId);
        if (languageChanged) await load();
      } else if (textPayload) {
        applyPayload(textPayload);
      }

      toast({ title: "Localization changes saved", status: "success" });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Localization changes could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const reset = (translationId: string | number) => {
    const id = String(translationId);
    const defaultValue =
      data?.translations.find((translation) => String(translation.id) === id)
        ?.root_value || "";
    setValues((current) => ({ ...current, [id]: defaultValue }));
    setResetIds((current) => {
      const next = new Set(current);
      if (overriddenIds.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const renderEditor = (translation: EditableTranslation) => {
    const id = String(translation.id);
    const value = values[id] || "";
    const hasOverride = overriddenIds.has(id);
    const isPending = pendingIds.has(id);
    const englishDefault = translation.default_value || "";
    const isMultiline = englishDefault.includes("\n");
    const onChange = (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setValues((current) => ({
        ...current,
        [id]: event.target.value,
      }));
      setResetIds((current) => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    };

    return (
      <VStack align="stretch" spacing="2">
        {isMultiline ? (
          <Textarea
            value={value}
            placeholder="Enter kiosk text"
            onChange={onChange}
            resize="vertical"
            minH="74px"
          />
        ) : (
          <Input
            value={value}
            placeholder="Enter kiosk text"
            onChange={onChange}
          />
        )}
        <Text color="bg.400" fontSize="xs" whiteSpace="pre-wrap">
          English default: {englishDefault || "—"}
        </Text>
        <HStack justify="space-between">
          <Badge
            colorScheme={
              isPending ? "orange" : hasOverride ? "purple" : "green"
            }
            variant="subtle"
          >
            {isPending ? "Unsaved" : hasOverride ? "Customized" : "Default"}
          </Badge>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => reset(translation.id)}
            isDisabled={!hasOverride && !dirtyIds.has(id)}
          >
            Reset
          </Button>
        </HStack>
      </VStack>
    );
  };

  return (
    <Box
      bg="bg.900"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={{ base: "5", md: "6" }}
    >
      <Stack
        direction={{ base: "column", xl: "row" }}
        justify="space-between"
        align={{ base: "stretch", xl: "end" }}
        spacing="5"
        mb="5"
      >
        <Box flex="1">
          <Text color="acid.300" fontWeight="800" fontSize="lg">
            Localization
          </Text>
          <Text color="bg.300">
            Set the kiosk language, currency, buttons, labels, and messages.
          </Text>
        </Box>
        <Stack
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "end" }}
          spacing="3"
        >
          <FormControl w={{ base: "full", md: "240px" }}>
            <FormLabel mb="1">Language</FormLabel>
            <Select
              value={languageId}
              onChange={(event) => setLanguageId(event.target.value)}
              placeholder="Select language"
            >
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                  {language.native_name ? ` — ${language.native_name}` : ""}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl w={{ base: "full", md: "240px" }}>
            <FormLabel mb="1">Currency</FormLabel>
            <Select
              value={currencyId}
              onChange={(event) => setCurrencyId(event.target.value)}
              placeholder="Select currency"
            >
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code}
                  {currency.name ? ` — ${currency.name}` : ""}
                  {currency.symbol ? ` (${currency.symbol})` : ""}
                </option>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="primary"
            minW="150px"
            onClick={() => void saveAllChanges()}
            isLoading={isSaving}
            isDisabled={
              isLoading ||
              !data ||
              !languageId ||
              !currencyId ||
              (!languageChanged && !currencyChanged && !pendingIds.size)
            }
          >
            Save changes{pendingIds.size ? ` (${pendingIds.size})` : ""}
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <HStack color="bg.300">
          <Spinner size="sm" />
          <Text>Loading kiosk texts…</Text>
        </HStack>
      ) : null}
      {error ? (
        <Alert status="error" mb="4">
          <AlertIcon />
          {error}
        </Alert>
      ) : null}

      {!isLoading && data && !data.language ? (
        <Alert status="warning">
          <AlertIcon />
          Choose and save a machine language before customizing kiosk texts.
        </Alert>
      ) : null}

      {!isLoading &&
      data?.language &&
      (!data.translation_set || data.translation_set.is_root === true) ? (
        <VStack align="stretch" spacing="4">
          <Text color="bg.200">
            This machine currently inherits the {data.language.name} default
            text pack.
          </Text>
          {!data.root_set ? (
            <Alert status="warning">
              <AlertIcon />
              No default text pack exists for this language.
            </Alert>
          ) : null}
          <Button
            variant="primary"
            alignSelf="start"
            onClick={() => void customize()}
            isLoading={isCreating}
            isDisabled={!data.root_set}
          >
            Customize texts
          </Button>
          <Text color="bg.400" fontSize="sm">
            Creates your own copy of the {data.language.name} defaults for this
            machine.
          </Text>
        </VStack>
      ) : null}

      {!isLoading && data?.language_mismatch ? (
        <Alert status="warning" alignItems="flex-start">
          <AlertIcon mt="1" />
          <Box>
            <Text fontWeight="800">The machine language has changed.</Text>
            <Text mb="3">
              The attached text pack belongs to{" "}
              {data.translation_set?.language?.name || "another language"}. Your
              previous translations will be kept.
            </Text>
            <Button
              size="sm"
              onClick={() => void customize()}
              isLoading={isCreating}
            >
              Use a {data.language?.name} text pack
            </Button>
          </Box>
        </Alert>
      ) : null}

      {!isLoading &&
      data?.translation_set &&
      !data.language_mismatch &&
      data.translation_set.is_root !== true ? (
        <VStack align="stretch" spacing="4">
          <Text color="bg.400" fontSize="md">
            Edit any text you want to customize. Applies to the kiosk within 5
            minutes. No restart needed.
          </Text>

          <Box position="relative">
            <Collapse
              in={areTranslationsExpanded}
              startingHeight={400}
              animateOpacity
            >
              <VStack
                display={{ base: "flex", md: "none" }}
                align="stretch"
                spacing="3"
              >
                {filtered.map((translation) => {
                  const id = String(translation.id);
                  return (
                    <Box
                      key={translation.id}
                      border="1px solid"
                      borderColor={
                        pendingIds.has(id) ? "orange.500" : "whiteAlpha.100"
                      }
                      borderRadius="xl"
                      bg={pendingIds.has(id) ? "whiteAlpha.50" : "bg.800"}
                      p="4"
                    >
                      <Text
                        color="bg.400"
                        fontSize="xs"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        mb="1"
                      >
                        Where it is used
                      </Text>
                      <Text color="bg.200" mb="4">
                        {translation.usage || "Usage not documented"}
                      </Text>
                      {renderEditor(translation)}
                    </Box>
                  );
                })}
              </VStack>

              <TableContainer
                display={{ base: "none", md: "block" }}
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="xl"
                overflowX="auto"
              >
                <Table size="sm" minW="680px">
                  <Thead bg="bg.800">
                    <Tr>
                      <Th minW="330px">Where it is used</Th>
                      <Th minW="330px">Your text</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filtered.map((translation) => {
                      const id = String(translation.id);
                      return (
                        <Tr
                          key={translation.id}
                          bg={pendingIds.has(id) ? "whiteAlpha.50" : undefined}
                        >
                          <Td
                            verticalAlign="top"
                            color="bg.200"
                            whiteSpace="normal"
                          >
                            {translation.usage || "Usage not documented"}
                          </Td>
                          <Td verticalAlign="top">
                            {renderEditor(translation)}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Collapse>
            {!areTranslationsExpanded ? (
              <Box
                position="absolute"
                right="0"
                bottom="0"
                left="0"
                h="20"
                bgGradient="linear(to-b, transparent, bg.900)"
                pointerEvents="none"
              />
            ) : null}
          </Box>
          <Button
            variant="outline"
            alignSelf="center"
            onClick={() => setAreTranslationsExpanded((expanded) => !expanded)}
          >
            {areTranslationsExpanded ? "Show less" : "Show all translations"}
          </Button>
          <Text color="bg.400" fontSize="sm">
            Showing {filtered.length} of {data.translations.length}{" "}
            customer-facing keys.
          </Text>
        </VStack>
      ) : null}
    </Box>
  );
}
