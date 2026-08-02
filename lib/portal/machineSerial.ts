import type { Machine } from "../../types/strapi";

export const getMachineSerialBase = (serialNumber: string) =>
  serialNumber.trim().split("-", 1)[0];

export class MachineSerialIssueError extends Error {
  constructor() {
    super("Multiple machines have the same base serial number.");
    this.name = "MachineSerialIssueError";
  }
}

export const findMachineBySerialBase = (
  machines: Machine[],
  serialNumber: string,
) => {
  const serialBase = getMachineSerialBase(serialNumber);
  const matches = machines.filter(
    (machine) =>
      getMachineSerialBase(String(machine.serial_number || "")) === serialBase,
  );

  if (matches.length > 1) {
    throw new MachineSerialIssueError();
  }

  return matches[0] || null;
};
