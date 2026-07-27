import fs from "fs/promises";
import type { NextApiRequest } from "next";
import formidable, { type File, type Fields, type Files } from "formidable";
import { requestStrapiRestAsService } from "./strapiClient";

export const MAX_WAV_BYTES = 20 * 1024 * 1024;

export const parseVoiceClipMultipart = async (req: NextApiRequest) => {
  const form = formidable({
    maxFiles: 1,
    maxFileSize: MAX_WAV_BYTES,
    allowEmptyFiles: false,
    multiples: false,
  });
  return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject(error);
      else resolve({ fields, files });
    });
  });
};

export const firstField = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

export const firstFile = (value: File | File[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const validateAndUploadWav = async (file: File) => {
  const filename = file.originalFilename || "";
  const mime = (file.mimetype || "").toLowerCase();
  if (
    !filename.toLowerCase().endsWith(".wav") ||
    !["audio/wav", "audio/x-wav", "audio/wave", "application/octet-stream"].includes(
      mime,
    )
  ) {
    throw new Error("Audio must be a .wav file with a WAV MIME type.");
  }
  if (!file.size || file.size > MAX_WAV_BYTES) {
    throw new Error("WAV must be no larger than 20 MB.");
  }
  const buffer = await fs.readFile(file.filepath);
  if (
    buffer.length < 44 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("File is not a valid RIFF/WAVE file.");
  }

  let offset = 12;
  let format: { audioFormat: number; channels: number; sampleRate: number; bits: number } | null =
    null;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (chunkId === "fmt " && chunkSize >= 16 && dataOffset + 16 <= buffer.length) {
      format = {
        audioFormat: buffer.readUInt16LE(dataOffset),
        channels: buffer.readUInt16LE(dataOffset + 2),
        sampleRate: buffer.readUInt32LE(dataOffset + 4),
        bits: buffer.readUInt16LE(dataOffset + 14),
      };
      break;
    }
    offset = dataOffset + chunkSize + (chunkSize % 2);
  }
  if (
    !format ||
    format.audioFormat !== 1 ||
    format.channels !== 1 ||
    format.sampleRate !== 44100 ||
    format.bits !== 16
  ) {
    throw new Error("WAV must be 16-bit PCM, mono, 44.1 kHz.");
  }

  const upload = new FormData();
  upload.append("files", new Blob([buffer], { type: "audio/wav" }), filename);
  const uploaded = await requestStrapiRestAsService<
    Array<{ id: string | number; url?: string }>
  >("/api/upload", { method: "POST", body: upload });
  if (!uploaded[0]?.id) throw new Error("Strapi did not return the uploaded WAV.");
  return uploaded[0];
};
