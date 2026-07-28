export const capitalize = (s: string | undefined) => {
  if (typeof s !== "string") return "";
  const words = s.split(" ");
  const res = words
    .map((w, index) =>
      index > 0 && w.length < 4
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
  return res;
};
