import {
  type FreeModeState,
  type FreeModeWriteResponse,
  freeModeStateFromMachine,
} from "../../lib/freeMode";
import type { Machine } from "../../types/strapi";
import { requestStrapiRestAsService } from "./strapiClient";

const FREE_MODE_FIELDS = [
  "id",
  "free_mode",
  "free_mode_minutes",
  "free_mode_started_at",
  "free_mode_rev",
  "free_mode_source",
];

export const getMachineFreeModeState = async (
  machineId: string | number,
): Promise<FreeModeState> => {
  const params = new URLSearchParams();
  FREE_MODE_FIELDS.forEach((field, index) =>
    params.set(`fields[${index}]`, field),
  );
  const machine = await requestStrapiRestAsService<Machine>(
    `/api/machines/${encodeURIComponent(machineId)}?${params.toString()}`,
  );
  return freeModeStateFromMachine(machine);
};

export const setMachineFreeMode = (
  machineId: string | number,
  input: { enabled: boolean; minutes: number; base_rev?: number },
) =>
  requestStrapiRestAsService<FreeModeWriteResponse>(
    `/api/machines/${encodeURIComponent(machineId)}/free-mode`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
