import type { NextApiRequest, NextApiResponse } from "next";
import { fetchStrapiRest, initCMSFetcher } from "../../../services/fetchers";
import { MachineBySerialQuery } from "../../../services/queries";
import normalize from "../../../services/normalizer";
import {
  requestStrapiAsService,
  requestStrapiRestAsService,
} from "../../../services/server/strapiClient";
import type { Client, Machine, MachineLookupResponse } from "../../../types/strapi";
import {
  findMachineBySerialBase,
  getMachineSerialBase,
  MachineSerialIssueError,
} from "../../../lib/portal/machineSerial";
import { WHATSAPP_SUPPORT_URL } from "../../../lib/portal/support";
import { addPortalMachineFields } from "../../../lib/portal/machinePrivacy";

const normalizeMachineClient = (machine: Machine | null): MachineLookupResponse => {
  const client = (machine?.client || null) as Client | null;
  return { machine, client };
};

const loadViaGraphql = async (serial: string) => {
  const fetcher = initCMSFetcher();
  const result = await fetcher(MachineBySerialQuery, { serial });
  const machine = findMachineBySerialBase(result?.machines || [], serial);
  return normalizeMachineClient(machine);
};

const loadViaServiceGraphql = async (serial: string) => {
  const raw = await requestStrapiAsService<any>(MachineBySerialQuery, { serial });
  const result = normalize(raw);
  const machine = findMachineBySerialBase(result?.machines || [], serial);
  return normalizeMachineClient(machine);
};

const loadViaRest = async (serial: string) => {
  const params = new URLSearchParams();
  addPortalMachineFields(params);
  params.set("filters[serial_number][$startsWith]", serial);
  params.set("populate[0]", "client");
  params.set("populate[1]", "machine_type");
  params.set("populate[2]", "currency");
  params.set("pagination[pageSize]", "2000");
  params.set("sort", "title:ASC");

  const result = await fetchStrapiRest(`/api/machines?${params.toString()}`);
  const machine = findMachineBySerialBase(result || [], serial);
  return normalizeMachineClient(machine);
};

const loadViaServiceRest = async (serial: string) => {
  const params = new URLSearchParams();
  addPortalMachineFields(params);
  params.set("filters[serial_number][$startsWith]", serial);
  params.set("populate[0]", "client");
  params.set("populate[1]", "machine_type");
  params.set("populate[2]", "currency");
  params.set("pagination[pageSize]", "2000");
  params.set("sort", "title:ASC");

  const result = await requestStrapiRestAsService<Machine[]>(
    `/api/machines?${params.toString()}`,
  );
  const machine = findMachineBySerialBase(result || [], serial);
  return normalizeMachineClient(machine);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | MachineLookupResponse
    | { error: string; message?: string; supportUrl?: string }
  >,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const rawSerial = Array.isArray(req.query.serial)
    ? req.query.serial[0]
    : req.query.serial;
  const serial = rawSerial ? getMachineSerialBase(rawSerial) : "";

  if (!serial) {
    return res.status(400).json({ error: "serial_required" });
  }

  if (!/^\d+$/.test(serial)) {
    return res.status(400).json({ error: "serial_must_contain_digits_only" });
  }

  try {
    const serviceRestResult = await loadViaServiceRest(serial);
    if (serviceRestResult.machine) {
      return res.status(200).json(serviceRestResult);
    }

    const restResult = await loadViaRest(serial);
    if (restResult.machine) {
      return res.status(200).json(restResult);
    }

    const serviceResult = await loadViaServiceGraphql(serial);
    if (serviceResult.machine) {
      return res.status(200).json(serviceResult);
    }

    const graphqlResult = await loadViaGraphql(serial);
    if (graphqlResult.machine) {
      return res.status(200).json(graphqlResult);
    }

    return res.status(200).json(restResult);
  } catch (error) {
    if (error instanceof MachineSerialIssueError) {
      return res.status(409).json({
        error: "serial_number_issue",
        message:
          "This machine has a serial number issue. Please contact support.",
        supportUrl: WHATSAPP_SUPPORT_URL,
      });
    }

    console.error("[strapi/machine-by-serial] lookup failed:", error);
    return res.status(500).json({ error: "machine_lookup_failed" });
  }
}
