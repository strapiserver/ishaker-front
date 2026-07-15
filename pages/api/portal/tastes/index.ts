import type { NextApiRequest, NextApiResponse } from "next";
import { getPortalSessionFromApiRequest } from "../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";

type EncodedFile = {
  name?: unknown;
  type?: unknown;
  data?: unknown;
};

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ELEMENTS = 5;

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const decodeImage = (value: EncodedFile, field: string) => {
  const name = asString(value?.name);
  const type = asString(value?.type).toLowerCase();
  const data = asString(value?.data);

  if (!name || !IMAGE_TYPES.has(type) || !data) {
    throw new Error(`${field} must be a PNG, JPEG, or WebP image.`);
  }

  const buffer = Buffer.from(data, "base64");
  if (!buffer.length || buffer.length > MAX_FILE_BYTES) {
    throw new Error(`${field} must be no larger than 5 MB.`);
  }

  return { name, type, buffer };
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });
  if (session.access !== "client") {
    return res.status(403).json({ error: "client_access_required" });
  }

  const name = asString(req.body?.name);
  const color = asString(req.body?.color);
  const rawElements = Array.isArray(req.body?.elements) ? req.body.elements : [];

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: "invalid_name", message: "Taste name must be 2–80 characters." });
  }
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return res.status(400).json({ error: "invalid_color", message: "Choose a valid color." });
  }
  if (rawElements.length > MAX_ELEMENTS) {
    return res.status(400).json({ error: "too_many_elements", message: "Upload at most 5 ingredient images." });
  }

  try {
    const main = decodeImage(req.body?.main || {}, "Main image");
    const circleImage = decodeImage(req.body?.circle || {}, "Circle image");
    const elements = rawElements.map((file: EncodedFile, index: number) =>
      decodeImage(file, `Ingredient image ${index + 1}`),
    );

    const form = new FormData();
    [main, circleImage, ...elements].forEach((file) => {
      form.append("files", new Blob([file.buffer], { type: file.type }), file.name);
    });

    const uploaded = await requestStrapiRestAsService<Array<{ id: string | number }>>(
      "/api/upload",
      { method: "POST", body: form },
    );

    if (!Array.isArray(uploaded) || uploaded.length < 2) {
      throw new Error("Strapi did not return the uploaded images.");
    }

    const circle = await requestStrapiRestAsService<{ id: string | number }>(
      "/api/circles",
      {
        method: "POST",
        body: JSON.stringify({
          data: {
            name: `${name} circle`,
            color,
            images: [uploaded[1].id],
          },
        }),
      },
    );

    const taste = await requestStrapiRestAsService("/api/tastes", {
      method: "POST",
      body: JSON.stringify({
        data: {
          name,
          main: uploaded[0].id,
          default_circle: circle.id,
          elements: uploaded.slice(2).map((file) => file.id),
          isWebsiteVisible: false,
          submission_status: "pending",
        },
      }),
    });

    return res.status(201).json({ ok: true, taste });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Custom taste submission failed.";
    console.error("[portal/tastes] submission failed:", error);
    return res.status(500).json({ error: "taste_submission_failed", message });
  }
}
