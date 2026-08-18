import {
  Alert,
  AlertIcon,
  AspectRatio,
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  SimpleGrid,
  VStack,
  Text,
} from "@chakra-ui/react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { PortalShell } from "../components/portal/PortalShell";
import { requirePortalSession } from "../lib/portal/auth";
import { getSmallestMediaUrl } from "../lib/portal/media";
import {
  mediaKeyFromFilename,
  normalizeMediaFilename,
} from "../lib/portal/mediaFilename";
import { requestStrapiRestAsService } from "../services/server/strapiClient";
import type { PortalSession, PortalTaste } from "../types/portal";

type CatalogPageProps = {
  session: PortalSession;
  tastes: PortalTaste[];
};

type EncodedFile = { name: string; type: string; data: string };

const MediaKeyPreview = ({ file }: { file: File | null }) =>
  file ? (
    <FormHelperText color="acid.300">
      Stored as <strong>{normalizeMediaFilename(file.name)}</strong>; machine
      key: <strong>{mediaKeyFromFilename(file.name)}</strong>
    </FormHelperText>
  ) : null;

const encodeFile = (file: File): Promise<EncodedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve({
        name: file.name,
        type: file.type,
        data: result.split(",")[1] || "",
      });
    };
    reader.readAsDataURL(file);
  });

export default function CatalogPage({ session, tastes }: CatalogPageProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7c3aed");
  const [main, setMain] = useState<File | null>(null);
  const [circle, setCircle] = useState<File | null>(null);
  const [elements, setElements] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!main || !circle) return;

    // Grab the form node before the first await: React nulls
    // event.currentTarget once the handler returns.
    const form = event.currentTarget;

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/portal/tastes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          color,
          main: await encodeFile(main),
          circle: await encodeFile(circle),
          elements: await Promise.all(elements.map(encodeFile)),
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.message || "Submission failed.");

      setMessage(
        "Custom taste submitted for review. It is not live on machines yet.",
      );
      setName("");
      setMain(null);
      setCircle(null);
      setElements([]);
      form.reset();
      // Re-run getServerSideProps so the new taste shows up in the
      // grid with its "Pending review" badge. A failed refresh must not
      // turn a successful submission into an error message.
      await router
        .replace(router.asPath, undefined, { scroll: false })
        .catch(() => undefined);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalShell
      title="Taste catalog"
      description="Browse available tastes or submit a custom taste for iShaker review."
      clientName={session.client.company}
    >
      <Box
        as="form"
        onSubmit={submit}
        bg="bg.900"
        border="1px solid"
        borderColor="whiteAlpha.100"
        borderRadius="2xl"
        p={{ base: "5", md: "7" }}
        maxW="760px"
        my="4"
      >
        <VStack spacing="5" align="stretch">
          <Box>
            <Text color="bg.50" fontSize="2xl" fontWeight="800">
              Add a custom taste
            </Text>
            <Text color="bg.300" mt="1">
              Your submission stays hidden until the iShaker team reviews and
              approves it.
            </Text>
          </Box>

          <FormControl isRequired>
            <FormLabel>Taste name</FormLabel>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              bg="bg.800"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Theme color</FormLabel>
            <Input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              w="100px"
              p="1"
              bg="bg.800"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Main image</FormLabel>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              p="1"
              onChange={(event) => setMain(event.target.files?.[0] || null)}
            />
            <FormHelperText>PNG, JPEG, or WebP; maximum 5 MB.</FormHelperText>
            <MediaKeyPreview file={main} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Circle image</FormLabel>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              p="1"
              onChange={(event) => setCircle(event.target.files?.[0] || null)}
            />
            <FormHelperText>
              Square transparent PNG works best; maximum 5 MB.
            </FormHelperText>
            <MediaKeyPreview file={circle} />
          </FormControl>

          <FormControl>
            <FormLabel>Ingredient images (optional)</FormLabel>
            <Input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              p="1"
              onChange={(event) =>
                setElements(Array.from(event.target.files || []).slice(0, 5))
              }
            />
            <FormHelperText>Up to 5 images, maximum 5 MB each.</FormHelperText>
          </FormControl>

          {message ? (
            <Alert status={isError ? "error" : "success"} borderRadius="xl">
              <AlertIcon />
              {message}
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            alignSelf="flex-start"
            isLoading={isSubmitting}
            isDisabled={!name || !main || !circle}
          >
            Submit custom taste
          </Button>
        </VStack>
      </Box>
      <SimpleGrid columns={{ base: 3, sm: 4, lg: 6 }} spacing="4" mb="10">
        {tastes.map((taste) => (
          <Box
            key={taste.id}
            bg="bg.900"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="2xl"
            overflow="hidden"
          >
            {taste.main?.url ? (
              <AspectRatio ratio={1} bg="bg.800">
                <Image
                  src={getSmallestMediaUrl(taste.main)}
                  alt={taste.name}
                  w="full"
                  h="full"
                  objectFit="contain"
                  p="3"
                />
              </AspectRatio>
            ) : null}
            <VStack p="5" spacing="2" align="stretch">
              <Text color="bg.50" fontWeight="800">
                {taste.name}
              </Text>
              {taste.submission_status === "pending" ? (
                <Badge colorScheme="yellow" alignSelf="flex-start">
                  Pending review
                </Badge>
              ) : null}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </PortalShell>
  );
}

export const getServerSideProps: GetServerSideProps<CatalogPageProps> = async (
  context,
) => {
  const result = await requirePortalSession(context);
  if ("redirect" in result) return { redirect: result.redirect };

  const tasteParams = new URLSearchParams();
  tasteParams.set("populate[main][fields][0]", "url");
  tasteParams.set("populate[main][fields][1]", "formats");
  tasteParams.set(
    "populate[default_circle][populate][images][fields][0]",
    "url",
  );
  tasteParams.set("sort[0]", "name:ASC");
  tasteParams.set("pagination[pageSize]", "2000");

  let tastes: PortalTaste[] = [];
  try {
    tastes = await requestStrapiRestAsService<PortalTaste[]>(
      `/api/tastes?${tasteParams.toString()}`,
    );
  } catch (error) {
    console.error("[catalog] taste loading failed:", error);
  }

  return { props: { session: result.session, tastes } };
};
