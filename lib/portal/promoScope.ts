type MachineScopedPromo = {
  code?: string | null;
  machine?: { id: string | number } | null;
};

const normalizedCode = (value: string) => value.trim().toUpperCase();
const normalizedMachineId = (value?: string | number | null) =>
  value === null || value === undefined || value === "" ? null : String(value);

export const hasPromoCodeScopeConflict = (
  promos: MachineScopedPromo[],
  code: string,
  machineId?: string | number | null,
) => {
  const wantedCode = normalizedCode(code);
  const wantedMachineId = normalizedMachineId(machineId);
  if (!wantedCode) return false;

  return promos.some((promo) => {
    if (normalizedCode(promo.code || "") !== wantedCode) return false;
    const existingMachineId = normalizedMachineId(promo.machine?.id);

    // A client-wide promo overlaps every machine. Otherwise, only two promos
    // assigned to the same specific machine conflict.
    return (
      wantedMachineId === null ||
      existingMachineId === null ||
      wantedMachineId === existingMachineId
    );
  });
};
