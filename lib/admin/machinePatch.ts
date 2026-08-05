import type { Machine } from "../../types/strapi";

export const getMachinePatchVersion = (machine: Machine) => {
  const reportedPatchId = machine.fleet_status?.patch_id;
  if (
    (typeof reportedPatchId === "string" && reportedPatchId.trim()) ||
    typeof reportedPatchId === "number"
  ) {
    return String(reportedPatchId);
  }

  if (machine.patch?.slug?.trim()) return machine.patch.slug;
  if (machine.patch?.id !== null && machine.patch?.id !== undefined) {
    return String(machine.patch.id);
  }

  return null;
};
