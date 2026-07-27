import { requestStrapiRestAsService } from "./strapiClient";

export type EncodedImage = {
  name?: unknown;
  type?: unknown;
  data?: unknown;
};

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const decodePortalImage = (
  value: EncodedImage,
  field: string,
  maxBytes = 5 * 1024 * 1024,
) => {
  const name = asString(value?.name);
  const type = asString(value?.type).toLowerCase();
  const data = asString(value?.data);
  if (!name || !IMAGE_TYPES.has(type) || !data) {
    throw new Error(`${field} must be a PNG, JPEG, or WebP image.`);
  }
  const buffer = Buffer.from(data, "base64");
  if (!buffer.length || buffer.length > maxBytes) {
    throw new Error(`${field} must be no larger than ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }
  return { name, type, buffer };
};

export const uploadPortalImages = async (
  images: Array<{ name: string; type: string; buffer: Buffer }>,
) => {
  const form = new FormData();
  images.forEach((file) => {
    form.append(
      "files",
      new Blob([Uint8Array.from(file.buffer)], { type: file.type }),
      file.name,
    );
  });
  return requestStrapiRestAsService<Array<{ id: string | number }>>(
    "/api/upload",
    { method: "POST", body: form },
  );
};
