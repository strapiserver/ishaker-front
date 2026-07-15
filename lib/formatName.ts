export const capitalizeName = (value?: string | null) => {
  const normalized = (value || "").trim();
  if (!normalized) return "";

  return `${normalized.charAt(0).toLocaleUpperCase()}${normalized.slice(1)}`;
};
