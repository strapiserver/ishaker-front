import type { NextApiRequest, NextApiResponse } from "next";
import { getPortalSessionFromApiRequest } from "../../../../lib/portal/auth";
import { buildMachineHealthRow } from "../../../../lib/portal/machineHealth";
import { applyMachineHealthFixture } from "../../../../lib/portal/machineHealthFixture";
import {
  getTelemetryMachineStatus,
  getTelemetryMachineStorage,
  isTelemetryConfigured,
  listTelemetryMachineSerials,
  resolveTelemetryOrganizationId,
} from "../../../../services/server/telemetryClient";
import type { TelemetryHealthInput } from "../../../../types/machineHealth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const session = await getPortalSessionFromApiRequest(req);
  if (!session || session.access !== "client" || !session.client.id) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const machines = applyMachineHealthFixture(session.machines);
  const telemetryBySerial = new Map<string, TelemetryHealthInput>();

  if (isTelemetryConfigured()) {
    try {
      const organizationId = await resolveTelemetryOrganizationId(session.client);
      if (organizationId) {
        const telemetryMachines = await listTelemetryMachineSerials(organizationId);
        const ownedSerials = new Set(
          machines.map((machine) => String(machine.serial_number || "").trim()),
        );
        const matches = telemetryMachines.filter((machine) =>
          ownedSerials.has(String(machine.serialNumber || "").trim()),
        );

        await Promise.all(
          matches.map(async (machine) => {
            const serial = String(machine.serialNumber || "").trim();
            const [status, storage] = await Promise.all([
              getTelemetryMachineStatus(machine.id).catch(() => null),
              getTelemetryMachineStorage(machine.id).catch(() => null),
            ]);
            telemetryBySerial.set(serial, { status, storage });
          }),
        );
      }
    } catch (error) {
      console.error("[portal/machines/health] telemetry fallback failed:", error);
    }
  }

  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({
    machines: machines.map((machine) =>
      buildMachineHealthRow(
        machine,
        telemetryBySerial.get(String(machine.serial_number || "").trim()),
      ),
    ),
  });
}
