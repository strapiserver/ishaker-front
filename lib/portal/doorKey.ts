import { createCipheriv } from "node:crypto";

const DAY_MS = 24 * 60 * 60 * 1000;

const twoDigits = (value: number) => String(value).padStart(2, "0");

export function utcDateVector(now: Date): string {
  return `${twoDigits(now.getUTCMonth() + 1)}-${twoDigits(
    now.getUTCDate(),
  )}-${now.getUTCFullYear()}`;
}

const derive = (key: string, vector: string) => {
  const keySalt = Buffer.from(
    Buffer.from(`${key}-salt`, "utf8").toString("base64"),
    "utf8",
  );
  const vectorSalt = Buffer.from(
    Buffer.from(`${vector}-salt`, "ascii").toString("base64"),
    "ascii",
  );
  const aesKey = Buffer.alloc(16);
  const iv = Buffer.alloc(16);

  for (let index = 0; index < vectorSalt.length; index += 1) {
    const offset = index % 16;
    iv[offset] = (iv[offset] + vectorSalt[index]) % 256;
  }
  for (let index = 0; index < keySalt.length; index += 1) {
    const offset = index % 16;
    aesKey[offset] = (aesKey[offset] + keySalt[index]) % 256;
  }

  return { aesKey, iv };
};

export function buildDoorKey(
  serial: string,
  opts: { dayOffset?: number; now?: Date } = {},
) {
  const now = opts.now ?? new Date();
  const effectiveDate = new Date(now.getTime() + (opts.dayOffset ?? 0) * DAY_MS);
  const vector = utcDateVector(effectiveDate);
  const { aesKey, iv } = derive(serial, vector);
  const cipher = createCipheriv("aes-128-cbc", aesKey, iv);
  const plaintext = `${serial}|${vector}`;
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const validUntil = new Date(
    Date.UTC(
      effectiveDate.getUTCFullYear(),
      effectiveDate.getUTCMonth(),
      effectiveDate.getUTCDate() + 1,
    ) - 1,
  );

  return {
    payload: `KEY-${Buffer.concat([iv, ciphertext]).toString("base64")}`,
    serial,
    vector,
    validUntil: validUntil.toISOString(),
  };
}
