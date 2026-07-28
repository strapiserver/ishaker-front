import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
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
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../../components/admin";
import Loader from "../../components/shared/Loader";
import { requireAdminSession } from "../../lib/admin/auth";

export default function AdminTranslationsPage() {
  const toast = useToast();
  const [languages, setLanguages] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [namespace, setNamespace] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newNamespace, setNewNamespace] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    const response = await fetch("/api/admin/translations");
    const payload = await response.json().catch(() => null);
    setIsLoading(false);
    if (!response.ok) {
      setError("Translations could not be loaded.");
      return;
    }
    setLanguages(payload.languages || []);
    setTranslations(payload.translations || []);
  };
  useEffect(() => {
    void load();
  }, []);

  const namespaces = useMemo(
    () =>
      Array.from(
        new Set(translations.map((item) => item.namespace).filter(Boolean)),
      ).sort(),
    [translations],
  );
  const filtered = translations.filter(
    (item) =>
      (!namespace || item.namespace === namespace) &&
      (!query ||
        item.key.toLowerCase().includes(query.toLowerCase()) ||
        (item.namespace || "").toLowerCase().includes(query.toLowerCase())),
  );

  const createKey = async () => {
    const response = await fetch("/api/admin/translations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key: newKey,
        namespace: newNamespace,
        description,
      }),
    });
    if (!response.ok) {
      toast({ title: "Key creation failed", status: "error" });
      return;
    }
    toast({ title: "Translation key created", status: "success" });
    setNewKey("");
    setDescription("");
    await load();
  };

  const saveKey = async (translation: any) => {
    const response = await fetch(`/api/admin/translations/${translation.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(translation),
    });
    toast({
      title: response.ok ? "Key saved" : "Key save failed",
      status: response.ok ? "success" : "error",
    });
    if (response.ok) await load();
  };

  const deleteKey = async (translation: any) => {
    if (!window.confirm(`Delete key "${translation.key}" and all entries?`)) return;
    const response = await fetch(`/api/admin/translations/${translation.id}`, {
      method: "DELETE",
    });
    toast({
      title: response.ok ? "Key deleted" : "Delete failed",
      status: response.ok ? "success" : "error",
    });
    if (response.ok) await load();
  };

  const updateLocalEntry = (
    translationId: string | number,
    languageId: string | number,
    patch: Record<string, any>,
  ) =>
    setTranslations((current) =>
      current.map((translation) => {
        if (String(translation.id) !== String(translationId)) return translation;
        const existing = (translation.entries || []).find(
          (entry: any) => String(entry.language?.id) === String(languageId),
        );
        const entries = existing
          ? translation.entries.map((entry: any) =>
              entry === existing ? { ...entry, ...patch } : entry,
            )
          : [
              ...(translation.entries || []),
              {
                language: languages.find(
                  (language) => String(language.id) === String(languageId),
                ),
                value: "",
                status: "draft",
                ...patch,
              },
            ];
        return { ...translation, entries };
      }),
    );

  const saveEntry = async (translation: any, language: any) => {
    const entry = (translation.entries || []).find(
      (item: any) => String(item.language?.id) === String(language.id),
    );
    const response = await fetch("/api/admin/translations/entries", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        translationId: translation.id,
        languageId: language.id,
        value: entry?.value || "",
        status: entry?.status || "draft",
      }),
    });
    toast({
      title: response.ok ? `${language.name} entry saved` : "Entry save failed",
      status: response.ok ? "success" : "error",
    });
    if (response.ok) await load();
  };

  return (
    <AdminShell title="Translations">
      {isLoading ? <Loader size="lg" mb="5" /> : null}
      {error ? <Alert status="error"><AlertIcon />{error}</Alert> : null}
      <Box bg="bg.900" p="5" borderRadius="2xl" mb="5">
        <HStack flexWrap="wrap">
          <Input maxW="300px" placeholder="Search key or namespace" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select maxW="240px" placeholder="All namespaces" value={namespace} onChange={(event) => setNamespace(event.target.value)}>
            {namespaces.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Button as="a" href="/api/admin/translations/export" variant="primary">Download approved Localization CSV</Button>
        </HStack>
      </Box>
      <Box bg="bg.900" p="5" borderRadius="2xl" mb="5">
        <Text color="acid.300" fontWeight="800" mb="3">Create key</Text>
        <HStack align="end" flexWrap="wrap">
          <FormControl maxW="320px"><FormLabel>Key</FormLabel><Input value={newKey} onChange={(event) => setNewKey(event.target.value)} /></FormControl>
          <FormControl maxW="220px"><FormLabel>Namespace</FormLabel><Input value={newNamespace} onChange={(event) => setNewNamespace(event.target.value)} /></FormControl>
          <FormControl maxW="360px"><FormLabel>Description</FormLabel><Input value={description} onChange={(event) => setDescription(event.target.value)} /></FormControl>
          <Button onClick={createKey} isDisabled={!newKey.trim()}>Create</Button>
        </HStack>
      </Box>
      <TableContainer bg="bg.900" borderRadius="2xl" maxH="70vh" overflow="auto">
        <Table size="sm" minW={`${500 + languages.length * 360}px`}>
          <Thead position="sticky" top="0" bg="bg.800" zIndex="1">
            <Tr><Th minW="330px">Key</Th>{languages.map((language) => <Th key={language.id} minW="360px">{language.name}</Th>)}</Tr>
          </Thead>
          <Tbody>
            {filtered.map((translation) => (
              <Tr key={translation.id}>
                <Td verticalAlign="top">
                  <VStack align="stretch">
                    <Input value={translation.key} onChange={(event) => setTranslations((items) => items.map((item) => item.id === translation.id ? { ...item, key: event.target.value } : item))} />
                    <Input placeholder="Namespace" value={translation.namespace || ""} onChange={(event) => setTranslations((items) => items.map((item) => item.id === translation.id ? { ...item, namespace: event.target.value } : item))} />
                    <HStack><Button size="xs" onClick={() => saveKey(translation)}>Save key</Button><Button size="xs" colorScheme="red" variant="ghost" onClick={() => deleteKey(translation)}>Delete</Button></HStack>
                  </VStack>
                </Td>
                {languages.map((language) => {
                  const entry = (translation.entries || []).find((item: any) => String(item.language?.id) === String(language.id));
                  return (
                    <Td key={language.id} verticalAlign="top">
                      <VStack align="stretch">
                        <Textarea value={entry?.value || ""} onChange={(event) => updateLocalEntry(translation.id, language.id, { value: event.target.value })} />
                        <HStack>
                          <Select size="sm" value={entry?.status || "draft"} onChange={(event) => updateLocalEntry(translation.id, language.id, { status: event.target.value })}>
                            <option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option>
                          </Select>
                          <Button size="sm" onClick={() => saveEntry(translation, language)}>Save</Button>
                        </HStack>
                      </VStack>
                    </Td>
                  );
                })}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </AdminShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = requireAdminSession(context);
  return redirect || { props: {} };
};
