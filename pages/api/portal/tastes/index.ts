import type { NextApiRequest, NextApiResponse } from "next";
import { getPortalSessionFromApiRequest } from "../../../../lib/portal/auth";
import { requestStrapiRestAsService } from "../../../../services/server/strapiClient";
import {
  decodePortalImage,
  uploadPortalImages,
} from "../../../../services/server/imageUpload";

const MAX_ELEMENTS = 5;

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

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
    // Reject duplicates before uploading anything: a retried submission
    // must not leave behind another circle, taste and image set.
    const duplicateParams = new URLSearchParams();
    duplicateParams.set("filters[name][$eqi]", name);
    duplicateParams.set("fields[0]", "name");
    duplicateParams.set("pagination[pageSize]", "1");
    const existing = await requestStrapiRestAsService<{ id: string | number }[]>(
      `/api/tastes?${duplicateParams.toString()}`,
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({
        error: "duplicate_name",
        message: `A taste named "${name}" already exists. Pick another name.`,
      });
    }

    const main = decodePortalImage(req.body?.main || {}, "Main image");
    const circleImage = decodePortalImage(req.body?.circle || {}, "Circle image");
    const elements = rawElements.map((file: any, index: number) =>
      decodePortalImage(file, `Ingredient image ${index + 1}`),
    );
    const uploaded = await uploadPortalImages([main, circleImage, ...elements]);

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
