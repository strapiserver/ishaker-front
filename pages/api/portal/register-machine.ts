import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMachineBySerialAsService } from "../../../lib/portal/auth";
import { setPortalSession } from "../../../lib/portal/auth";
import { getStrapiBaseUrl } from "../../../services/fetchers";
import { requestStrapiRestAsService } from "../../../services/server/strapiClient";
import {
  changeTelemetryMachineOrganization,
  createTelemetryOrganization,
  findTelemetryMachineBySerial,
  getMissingTelemetryEnvKeys,
  getTelemetryUserUuid,
  isTelemetryConfigured,
  provisionTelemetryMachineSetup,
  resolveTelemetryOrganizationId,
} from "../../../services/server/telemetryClient";
import type { Client, Machine } from "../../../types/strapi";

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const WHATSAPP_COUNTRY_CODE_REGEX = /^\+[1-9]\d{0,3}$/;
const WHATSAPP_LOCAL_NUMBER_REGEX = /^[0-9 ]{6,20}$/;
const getErrorPayload = (error: unknown) => {
  const apiError = error as {
    status?: number;
    response?: {
      error?: {
        message?: string;
        details?: unknown;
        name?: string;
      };
    };
    message?: string;
  };

  return {
    status: apiError.status || 500,
    message:
      apiError.response?.error?.message ||
      apiError.response?.error?.name ||
      apiError.message ||
      "Registration submission failed.",
    details: apiError.response?.error?.details || null,
  };
};

const getTelemetryErrorPayload = (error: unknown) => {
  const apiError = error as {
    status?: number;
    response?: unknown;
    message?: string;
  };

  return {
    status: apiError.status && apiError.status >= 400 ? apiError.status : 502,
    message: apiError.message || "Telemetry sync failed.",
    details: apiError.response || null,
  };
};

const getId = (value: unknown) => {
  const id = (value as { id?: string | number } | null)?.id;
  return id === undefined || id === null ? null : id;
};

const getTelemetryId = (value: unknown): number | null => {
  const id = getId(value);
  if (typeof id === "number") return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nestedId =
      getTelemetryId(record.machine) ||
      getTelemetryId(record.organization) ||
      getTelemetryId(record.data);
    if (nestedId) return nestedId;

    const explicitId = record.machineId || record.organizationId;
    if (typeof explicitId === "number") return explicitId;
    if (typeof explicitId === "string" && /^\d+$/.test(explicitId)) return Number(explicitId);
  }

  return null;
};

const getRegistrationCode = (payload: any) =>
  asString(payload?.registrationKey) ||
  asString(payload?.registrationCode) ||
  asString(payload?.registration_code) ||
  asString(payload?.qrPayload?.registrationKey) ||
  asString(payload?.qrPayload?.registrationCode) ||
  asString(payload?.machine?.registrationKey) ||
  asString(payload?.machine?.registrationCode) ||
  asString(payload?.key) ||
  asString(payload?.machineKey);

const contactLabel = (params: {
  messengerType: string;
  messengerCountryCode: string;
  messengerValue: string;
  email: string;
}) => {
  if (params.messengerType === "whatsapp") {
    return `${params.messengerCountryCode} ${params.messengerValue}`.trim();
  }

  return params.email;
};

const buildClientContact = (params: {
  messengerType: string;
  messengerCountryCode: string;
  messengerValue: string;
  email: string;
}) => {
  const contacts = [
    {
      __component: "email.email",
      email: params.email,
    },
  ];

  if (params.messengerType === "whatsapp") {
    contacts.push({
      __component: "whatsapp.whatsapp",
      whatsapp: contactLabel(params),
    } as any);
  }

  return contacts;
};

const fetchClientByPortalEmail = async (email: string) => {
  const params = new URLSearchParams();
  params.set("filters[portal_email][$eqi]", email.toLowerCase());
  params.set("pagination[pageSize]", "1000");

  const clients = await requestStrapiRestAsService<Client[]>(
    `/api/clients?${params.toString()}`,
  );

  return clients[0] || null;
};

const fetchClientByCompany = async (company: string) => {
  const params = new URLSearchParams();
  params.set("filters[company][$eqi]", company);
  params.set("pagination[pageSize]", "1000");

  const clients = await requestStrapiRestAsService<Client[]>(
    `/api/clients?${params.toString()}`,
  );

  return clients[0] || null;
};

const createClient = async (params: {
  company: string;
  email: string;
  messengerType: string;
  messengerCountryCode: string;
  messengerValue: string;
}) =>
  requestStrapiRestAsService<Client>("/api/clients", {
    method: "POST",
    body: JSON.stringify({
      data: {
        company: params.company,
        portal_email: params.email,
        portal_access_enabled: true,
        portal_auth_provider: "local",
        status: "client",
        country: "USA",
        contact: buildClientContact(params),
      },
    }),
  });

const updateClientPortalAccess = async (
  clientId: string | number,
  email: string,
  telemetryOrganizationId?: number | null,
) =>
  requestStrapiRestAsService<Client>(`/api/clients/${clientId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        portal_email: email,
        portal_access_enabled: true,
        portal_auth_provider: "local",
        ...(telemetryOrganizationId ? { telemetry_organization_id: telemetryOrganizationId } : {}),
      },
    }),
  });

const resolveClientForRegistration = async (params: {
  machine: Machine;
  company: string;
  email: string;
  messengerType: string;
  messengerCountryCode: string;
  messengerValue: string;
}) => {
  if (params.machine.client?.id) {
    const updated = await updateClientPortalAccess(params.machine.client.id, params.email);
    return updated || params.machine.client;
  }

  const existingByEmail = await fetchClientByPortalEmail(params.email);
  const existingByCompany = existingByEmail ? null : await fetchClientByCompany(params.company);
  const client =
    existingByEmail ||
    existingByCompany ||
    (await createClient({
      company: params.company,
      email: params.email,
      messengerType: params.messengerType,
      messengerCountryCode: params.messengerCountryCode,
      messengerValue: params.messengerValue,
    }));

  if (!client?.id) {
    throw new Error("Client account could not be created.");
  }

  if (existingByEmail || existingByCompany) {
    await updateClientPortalAccess(client.id, params.email);
  }

  await requestStrapiRestAsService(`/api/machines/${params.machine.id}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        client: client.id,
      },
    }),
  });

  return client;
};

const syncTelemetry = async (params: {
  client: Client;
  machine: Machine;
  company: string;
  contactName: string;
  email: string;
  messengerType: string;
  messengerCountryCode: string;
  messengerValue: string;
}) => {
  if (!isTelemetryConfigured()) {
    const missing = getMissingTelemetryEnvKeys();
    throw new Error(
      `Telemetry environment is not configured. Missing: ${missing.join(", ")}`,
    );
  }

  const userUuid = await getTelemetryUserUuid();
  if (!userUuid) {
    throw new Error("Telemetry root user UUID could not be read.");
  }

  const existingOrganizationId = await resolveTelemetryOrganizationId(params.client);
  let organizationId = existingOrganizationId;

  if (!organizationId) {
    const created = await createTelemetryOrganization({
      name: params.company,
      description: `Created from iShaker portal for ${params.email}.`,
      currency: "$",
      isTest: false,
      enabledModules: [],
      isUsedLocalProductBase: false,
      isDocumentUploadEnabled: false,
      contacts: [
        {
          name: params.contactName,
          contact: contactLabel(params),
        },
      ],
    });

    organizationId = getTelemetryId(created) || (await resolveTelemetryOrganizationId({
      company: params.company,
    }));
  }

  if (!organizationId) {
    throw new Error("Telemetry organization was not resolved after create.");
  }

  let telemetryNoteSuffix = "";
  if (params.client.telemetry_organization_id !== organizationId) {
    await updateClientPortalAccess(params.client.id, params.email, organizationId).catch((error) => {
      console.error("[portal/register-machine] telemetry org id save failed:", error);
      telemetryNoteSuffix =
        " Strapi telemetry organization id was not saved; check that the client.telemetry_organization_id field is deployed.";
    });
  }

  const existingMachine = await findTelemetryMachineBySerial(params.machine.serial_number);

  if (existingMachine?.machine?.id) {
    if (existingMachine.organizationId !== organizationId) {
      await changeTelemetryMachineOrganization(
        existingMachine.machine.id,
        organizationId,
        userUuid,
      );

      return {
        status: "moved",
        organizationId,
        machineId: existingMachine.machine.id,
        note: `Telemetry machine moved from organization ${existingMachine.organizationId} to ${organizationId}.${telemetryNoteSuffix}`,
      };
    }

    return {
      status: "exists",
      organizationId,
      machineId: existingMachine.machine.id,
      note: `Telemetry machine already exists in organization ${organizationId}.${telemetryNoteSuffix}`,
    };
  }

  const provisioned = await provisionTelemetryMachineSetup(userUuid, {
    organizationId,
    serialNumber: params.machine.serial_number,
    shipmentDate: new Date().toISOString().slice(0, 10),
  });
  const registrationCode = getRegistrationCode(provisioned);

  if (registrationCode) {
    await requestStrapiRestAsService(`/api/machines/${params.machine.id}`, {
      method: "PUT",
      body: JSON.stringify({
        data: {
          telemetry_reg_code: registrationCode,
        },
      }),
    });
  }

  return {
    status: "provisioned",
    organizationId,
    machineId: getTelemetryId(provisioned),
    registrationCode,
    note: `Telemetry machine provisioned in organization ${organizationId}.${telemetryNoteSuffix}`,
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const serialNumber = asString(req.body?.serialNumber);
  const company = asString(req.body?.company);
  const contactName = asString(req.body?.contactName);
  const email = asString(req.body?.email);
  const messengerType = asString(req.body?.messengerType);
  const messengerCountryCode = asString(req.body?.messengerCountryCode);
  const messengerValue = asString(req.body?.messengerValue);
  const password = asString(req.body?.password);
  const passwordConfirmation = asString(req.body?.passwordConfirmation);

  if (
    !serialNumber ||
    !company ||
    !contactName ||
    !email ||
    !messengerType ||
    !messengerValue ||
    !password ||
    !passwordConfirmation
  ) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  if (password !== passwordConfirmation) {
    return res.status(400).json({ error: "password_mismatch" });
  }

  if (messengerType !== "whatsapp") {
    return res.status(400).json({
      error: "invalid_messenger",
      message: "WhatsApp is required for registration.",
    });
  }

  if (
    !WHATSAPP_COUNTRY_CODE_REGEX.test(messengerCountryCode) ||
    !WHATSAPP_LOCAL_NUMBER_REGEX.test(messengerValue)
  ) {
    return res.status(400).json({
      error: "invalid_whatsapp",
      message: "Enter a valid WhatsApp number.",
    });
  }

  const matchedMachine = await fetchMachineBySerialAsService(serialNumber).catch((error) => {
    console.error("[portal/register-machine] machine lookup failed:", error);
    return null;
  });

  if (!matchedMachine?.id) {
    return res.status(404).json({
      error: "machine_not_found",
      message: "This machine serial number was not found in Strapi.",
    });
  }

  let client: Client;
  try {
    client = await resolveClientForRegistration({
      machine: matchedMachine,
      company,
      email: email.toLowerCase(),
      messengerType,
      messengerCountryCode,
      messengerValue,
    });
  } catch (error) {
    console.error("[portal/register-machine] client resolution failed:", error);
    const payload = getErrorPayload(error);
    return res.status(payload.status).json({
      error: "client_resolution_failed",
      message: payload.message,
      details: payload.details,
    });
  }

  let telemetryResult: {
    status: string;
    organizationId?: number | null;
    machineId?: number | null;
    registrationCode?: string;
    note?: string;
  };
  try {
    telemetryResult = await syncTelemetry({
      client,
      machine: matchedMachine,
      company,
      contactName,
      email: email.toLowerCase(),
      messengerType,
      messengerCountryCode,
      messengerValue,
    });
  } catch (error) {
    console.error("[portal/register-machine] telemetry sync failed:", error);
    const payload = getTelemetryErrorPayload(error);
    return res.status(payload.status).json({
      error: "telemetry_sync_failed",
      message: payload.message,
      details: payload.details,
    });
  }

  const registerResponse = await fetch(`${getStrapiBaseUrl()}/api/auth/local/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: email.toLowerCase(),
      email: email.toLowerCase(),
      password,
      client: client.id,
    }),
  });

  const registerPayload = await registerResponse.json().catch(() => null);

  if (!registerResponse.ok || !registerPayload?.jwt) {
    return res.status(registerResponse.status || 500).json({
      error: "registration_submission_failed",
      message:
        registerPayload?.error?.message ||
        registerPayload?.message ||
        "Portal account could not be created.",
      details: registerPayload?.error?.details || registerPayload?.details || null,
    });
  }

  const data = {
    serial_number: serialNumber,
    machine_title: matchedMachine?.title || asString(req.body?.machineTitle),
    company,
    contact_name: contactName,
    email,
    portal_auth_provider: "local",
    location: asString(req.body?.location),
    notes: [
      asString(req.body?.notes),
      messengerType && messengerValue
        ? `WhatsApp: ${messengerCountryCode} ${messengerValue}`.trim()
        : "",
      telemetryResult?.note || "",
    ]
      .filter(Boolean)
      .join("\n"),
    requested_at: new Date().toISOString(),
    status: "pending",
    ...(matchedMachine?.id ? { machine: matchedMachine.id } : {}),
    ...(client?.id ? { client: client.id } : {}),
    ...(registerPayload?.user?.id ? { portal_user: registerPayload.user.id } : {}),
  };

  try {
    const response = await requestStrapiRestAsService(
      "/api/portal-registration-requests",
      {
        method: "POST",
        body: JSON.stringify({ data }),
      },
    );

    setPortalSession(res, registerPayload.jwt);
    return res.status(200).json({ ok: true, response });
  } catch (error) {
    console.error("[portal/register-machine] failed:", error);
    const payload = getErrorPayload(error);
    return res.status(payload.status).json({
      error: "registration_submission_failed",
      message: payload.message,
      details: payload.details,
    });
  }
}
