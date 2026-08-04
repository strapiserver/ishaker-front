export type MachineTypeContainerSource = {
  container_count?: unknown;
  name?: unknown;
};

export const getMachineContainerCount = (
  machineType?: MachineTypeContainerSource | null,
) => {
  const configuredCount = Number(machineType?.container_count);
  if (Number.isInteger(configuredCount) && configuredCount > 0) {
    return configuredCount;
  }

  // Preserve support for existing machine types that predate container_count.
  const model = String(machineType?.name || "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  if (model.includes("touch")) return 8;
  if (model === "shaker s" || model.endsWith(" shaker s")) return 4;
  return null;
};

export const getLowestFreeContainerSlot = (
  positions: number[],
  containerCount: number,
) => {
  const occupied = new Set(positions);
  for (let slot = 1; slot <= containerCount; slot += 1) {
    if (!occupied.has(slot)) return slot;
  }
  return null;
};

export const getDuplicateContainerSlots = (positions: number[]) => {
  const counts = new Map<number, number>();
  positions.forEach((position) =>
    counts.set(position, (counts.get(position) || 0) + 1),
  );
  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([position]) => position),
  );
};

export const isValidContainerSlot = (
  position: number,
  containerCount: number | null,
) =>
  containerCount !== null &&
  Number.isInteger(position) &&
  position >= 1 &&
  position <= containerCount;
