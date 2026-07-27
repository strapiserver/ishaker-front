import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
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
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../../components/admin";
import { SearchableImageSelect } from "../../components/portal/product-lines";
import { requireAdminSession } from "../../lib/admin/auth";
import { formatMoney } from "../../lib/portal/currency";
import { getSmallestMediaUrl } from "../../lib/portal/media";

type Row = {
  position: number;
  cellCategory: "powder" | "concentrate";
  productId: string;
  price: string;
  isActive: boolean;
};

const emptyForm = () => ({
  id: "",
  name: "",
  slug: "",
  description: "",
  isDefault: false,
  isActive: true,
  isTemplate: false,
  machineTypeId: "",
  currencyId: "",
  languageId: "",
  productLineId: "",
  cells: [] as Row[],
});

export default function AdminPresetsPage() {
  const toast = useToast();
  const confirm = useDisclosure();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [targetMachineId, setTargetMachineId] = useState("");
  const [applyMode, setApplyMode] = useState<"merge" | "replaceAll">("merge");
  const [replacePrices, setReplacePrices] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError("");
    const response = await fetch("/api/admin/presets", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    setIsLoading(false);
    if (!response.ok) {
      setError("Presets could not be loaded.");
      return;
    }
    setData(payload);
  };

  useEffect(() => {
    void load();
  }, []);

  const choosePreset = (id: string) => {
    const preset = data?.presets?.find((item: any) => String(item.id) === id);
    if (!preset) {
      setForm(emptyForm());
      return;
    }
    setForm({
      id: String(preset.id),
      name: preset.name || "",
      slug: preset.slug || "",
      description: preset.description || "",
      isDefault: preset.isDefault === true,
      isActive: preset.isActive !== false,
      isTemplate: preset.is_template === true,
      machineTypeId: preset.machine_type?.id
        ? String(preset.machine_type.id)
        : "",
      currencyId: preset.currency?.id ? String(preset.currency.id) : "",
      languageId: preset.language?.id ? String(preset.language.id) : "",
      productLineId: preset.product_line?.id
        ? String(preset.product_line.id)
        : "",
      cells: (preset.cells || [])
        .sort((a: any, b: any) => Number(a.position) - Number(b.position))
        .map((cell: any) => ({
          position: Number(cell.position),
          cellCategory: cell.cell_category || "powder",
          productId: cell.product?.id ? String(cell.product.id) : "",
          price:
            cell.price === null || cell.price === undefined
              ? ""
              : String(cell.price),
          isActive: cell.isActive !== false,
        })),
    });
  };

  const products = useMemo(
    () =>
      (data?.options?.products || []).filter(
        (product: any) =>
          product.isPopular === true &&
          String(product.product_line?.id) === form.productLineId,
      ),
    [data, form.productLineId],
  );
  const productOptions = useMemo(
    () =>
      products.map((product: any) => ({
        id: String(product.id),
        name: product.name || `Product ${product.id}`,
        imageUrl: getSmallestMediaUrl(
          product.custom_main || product.taste?.main,
        ),
        subtitle: product.brand?.name || product.product_line?.name,
      })),
    [products],
  );
  const selectedCurrency = data?.options?.currencies?.find(
    (currency: any) => String(currency.id) === form.currencyId,
  );

  const save = async () => {
    setIsSaving(true);
    setError("");
    const response = await fetch(
      form.id ? `/api/admin/presets/${form.id}` : "/api/admin/presets",
      {
        method: form.id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const payload = await response.json().catch(() => null);
    setIsSaving(false);
    if (!response.ok) {
      const message = payload?.message || "Preset could not be saved.";
      setError(message);
      toast({ title: "Save failed", description: message, status: "error" });
      return;
    }
    toast({ title: "Preset saved", status: "success" });
    setForm(emptyForm());
    await load();
  };

  const remove = async () => {
    if (!form.id || !window.confirm(`Delete preset "${form.name}"?`)) return;
    const response = await fetch(`/api/admin/presets/${form.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast({ title: "Delete failed", status: "error" });
      return;
    }
    toast({ title: "Preset deleted", status: "success" });
    setForm(emptyForm());
    await load();
  };

  const previewApply = async () => {
    if (!form.id || !targetMachineId) return;
    setIsApplying(true);
    const response = await fetch(`/api/admin/presets/${form.id}/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        machineId: targetMachineId,
        mode: applyMode,
        replacePrices,
        confirm: false,
      }),
    });
    const payload = await response.json().catch(() => null);
    setIsApplying(false);
    if (!response.ok) {
      toast({
        title: "Preview failed",
        description: payload?.message || "Apply diff could not be created.",
        status: "error",
      });
      return;
    }
    setPreview(payload);
    confirm.onOpen();
  };

  const apply = async () => {
    if (!preview) return;
    setIsApplying(true);
    const response = await fetch(`/api/admin/presets/${form.id}/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        machineId: targetMachineId,
        mode: applyMode,
        replacePrices,
        confirm: true,
        expectedHash: preview.hash,
      }),
    });
    const payload = await response.json().catch(() => null);
    setIsApplying(false);
    if (!response.ok) {
      setPreview(payload?.diff ? { hash: payload.hash, diff: payload.diff } : preview);
      toast({
        title: "Apply failed",
        description: payload?.message || "Preset could not be applied.",
        status: "error",
      });
      return;
    }
    confirm.onClose();
    toast({ title: "Preset applied", status: "success" });
    await load();
  };

  return (
    <AdminShell title="Presets">
      {isLoading ? <Spinner /> : null}
      {error ? (
        <Alert status="error" mb="5"><AlertIcon />{error}</Alert>
      ) : null}
      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing="6">
        <Box bg="bg.900" p="5" borderRadius="2xl">
          <Button mb="4" variant="primary" onClick={() => setForm(emptyForm())}>
            New preset
          </Button>
          <VStack align="stretch">
            {(data?.presets || []).map((preset: any) => (
              <Button
                key={preset.id}
                variant={form.id === String(preset.id) ? "primary" : "contrast"}
                justifyContent="space-between"
                onClick={() => choosePreset(String(preset.id))}
              >
                {preset.name}
                {preset.isDefault ? <Badge>Default</Badge> : null}
              </Button>
            ))}
          </VStack>
        </Box>

        <Box bg="bg.900" p="6" borderRadius="2xl" gridColumn={{ xl: "span 2" }}>
          <VStack align="stretch" spacing="4">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                      ...(!current.id
                        ? {
                            slug: event.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, ""),
                          }
                        : {}),
                    }))
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Slug</FormLabel>
                <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
              </FormControl>
              {[
                ["Machine type", "machineTypeId", data?.options?.machineTypes, "name"],
                ["Currency", "currencyId", data?.options?.currencies, "code"],
                ["Language", "languageId", data?.options?.languages, "name"],
                ["Product line", "productLineId", data?.options?.productLines, "name"],
              ].map(([label, key, options, display]: any) => (
                <FormControl isRequired key={key}>
                  <FormLabel>{label}</FormLabel>
                  <Select
                    value={(form as any)[key]}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        [key]: event.target.value,
                        ...(key === "productLineId"
                          ? {
                              cells: form.cells.map((cell) => ({
                                ...cell,
                                productId: "",
                              })),
                            }
                          : {}),
                      })
                    }
                    placeholder={`Select ${String(label).toLowerCase()}`}
                  >
                    {(options || []).map((option: any) => (
                      <option key={option.id} value={option.id}>{option[display]}</option>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </SimpleGrid>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </FormControl>
            <HStack>
              <Checkbox isChecked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}>Default</Checkbox>
              <Checkbox isChecked={form.isTemplate} onChange={(event) => setForm({ ...form, isTemplate: event.target.checked })}>Template</Checkbox>
              <Checkbox isChecked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })}>Active</Checkbox>
            </HStack>

            <HStack justify="space-between">
              <Text color="acid.300" fontWeight="800">Planogram</Text>
              <Button
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    cells: [
                      ...form.cells,
                      {
                        position: form.cells.length
                          ? Math.max(...form.cells.map((cell) => cell.position)) + 1
                          : 0,
                        cellCategory: "powder",
                        productId: "",
                        price: "",
                        isActive: true,
                      },
                    ],
                  })
                }
              >
                Add position
              </Button>
            </HStack>
            <TableContainer>
              <Table minW="840px">
                <Thead><Tr><Th>Position</Th><Th>Category</Th><Th>Product</Th><Th>Price</Th><Th>Active</Th><Th /></Tr></Thead>
                <Tbody>
                  {form.cells.map((cell, index) => {
                    const selectedProduct = products.find(
                      (product: any) => String(product.id) === cell.productId,
                    );
                    const dosagePrice =
                      selectedProduct?.dosage?.full_drink_price ?? null;
                    const effectivePrice =
                      cell.price === "" ? dosagePrice : cell.price;
                    return (
                    <Tr key={`${cell.position}-${index}`}>
                      <Td><NumberInput min={0} value={cell.position}><NumberInputField onChange={(event) => {
                        const cells = [...form.cells]; cells[index] = { ...cell, position: Number(event.target.value) }; setForm({ ...form, cells });
                      }} /></NumberInput></Td>
                      <Td><Select value={cell.cellCategory} onChange={(event) => {
                        const cells = [...form.cells]; cells[index] = { ...cell, cellCategory: event.target.value as Row["cellCategory"] }; setForm({ ...form, cells });
                      }}><option value="powder">Powder</option><option value="concentrate">Concentrate</option></Select></Td>
                      <Td minW="320px">
                        <SearchableImageSelect
                          ariaLabel={`Product for preset position ${cell.position}`}
                          emptyLabel={
                            form.productLineId
                              ? "Nothing found"
                              : "Select a product line first"
                          }
                          options={productOptions}
                          placeholder="Search products"
                          value={cell.productId}
                          isDisabled={!form.productLineId}
                          onChange={(value) => {
                            const cells = [...form.cells];
                            cells[index] = { ...cell, productId: value };
                            setForm({ ...form, cells });
                          }}
                        />
                      </Td>
                      <Td>
                        <NumberInput min={0} precision={2} value={cell.price}>
                          <NumberInputField placeholder="Inherit dosage" onChange={(event) => {
                            const cells = [...form.cells]; cells[index] = { ...cell, price: event.target.value }; setForm({ ...form, cells });
                          }} />
                        </NumberInput>
                        <HStack mt="1">
                          <Text fontSize="xs" color="bg.400">
                            {effectivePrice === null
                              ? "No dosage price"
                              : formatMoney(effectivePrice, selectedCurrency)}
                          </Text>
                          <Badge>
                            {cell.price === "" ? "Inherited" : "Override"}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td><Switch isChecked={cell.isActive} onChange={(event) => {
                        const cells = [...form.cells]; cells[index] = { ...cell, isActive: event.target.checked }; setForm({ ...form, cells });
                      }} /></Td>
                      <Td><Button colorScheme="red" variant="ghost" onClick={() => setForm({ ...form, cells: form.cells.filter((_, cellIndex) => cellIndex !== index) })}>Remove</Button></Td>
                    </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
            <HStack>
              <Button variant="primary" onClick={save} isLoading={isSaving}>Save preset</Button>
              {form.id ? <Button colorScheme="red" variant="outline" onClick={remove}>Delete</Button> : null}
            </HStack>

            {form.id ? (
              <Box borderTop="1px solid" borderColor="whiteAlpha.200" pt="5">
                <Text color="acid.300" fontWeight="800" mb="3">Apply to machine</Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing="3">
                  <Select value={targetMachineId} onChange={(event) => setTargetMachineId(event.target.value)} placeholder="Target machine">
                    {(data?.options?.machines || []).map((machine: any) => <option key={machine.id} value={machine.id}>{machine.title || machine.serial_number}</option>)}
                  </Select>
                  <Select value={applyMode} onChange={(event) => setApplyMode(event.target.value as any)}>
                    <option value="merge">Merge listed positions</option>
                    <option value="replaceAll">Replace all cells</option>
                  </Select>
                  <Checkbox isChecked={replacePrices} onChange={(event) => setReplacePrices(event.target.checked)}>
                    Replace prices too
                  </Checkbox>
                </SimpleGrid>
                <Button mt="3" onClick={previewApply} isLoading={isApplying} isDisabled={!targetMachineId}>
                  Preview apply diff
                </Button>
              </Box>
            ) : null}
          </VStack>
        </Box>
      </SimpleGrid>

      <Modal isOpen={confirm.isOpen} onClose={confirm.onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm preset changes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb="3">
              Currency and language will be set from the preset. Review every cell operation before writing.
            </Text>
            <TableContainer maxH="55vh" overflowY="auto">
              <Table size="sm">
                <Thead><Tr><Th>Action</Th><Th>Position</Th><Th>Before</Th><Th>After</Th><Th>Price rule</Th></Tr></Thead>
                <Tbody>
                  {(preview?.diff?.cells || []).map((cell: any) => (
                    <Tr key={`${cell.action}-${cell.position}`}>
                      <Td><Badge>{cell.action}</Badge></Td>
                      <Td>{cell.position}</Td>
                      <Td>{cell.before?.productName || "Empty"} / {cell.before?.price ?? "inherit"}</Td>
                      <Td>{cell.after?.productName || "Empty"} / {cell.after?.price ?? "inherit"}</Td>
                      <Td>{cell.priceDecision || "removed"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </ModalBody>
          <ModalFooter>
            <Button mr="3" onClick={confirm.onClose}>Cancel</Button>
            <Button colorScheme="red" onClick={apply} isLoading={isApplying}>
              Apply confirmed diff
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const redirect = requireAdminSession(context);
  return redirect || { props: {} };
};
