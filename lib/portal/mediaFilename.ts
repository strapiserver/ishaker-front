const extensionOf = (filename: string) => {
  const match = filename.match(/(\.[^.]+)$/);
  return match?.[1] || "";
};

export const normalizeMediaFilename = (value: string) => {
  const filename = value.trim().split(/[\\/]/).pop()?.toLowerCase() || "";
  const extension = extensionOf(filename);
  const rawStem = (
    extension ? filename.slice(0, -extension.length) : filename
  ).trim();
  const stem = rawStem
    .replace(/(?: copy| \(\d+\))$/i, "")
    .trim()
    .replace(/[ _]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${stem || "media"}${extension}`;
};

export const mediaKeyFromFilename = (filename: string) => {
  const normalized = normalizeMediaFilename(filename);
  const extension = extensionOf(normalized);
  return extension ? normalized.slice(0, -extension.length) : normalized;
};
