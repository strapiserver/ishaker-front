type TelemetryToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAtMs: number;
};

type TelemetryOrganization = {
  id: number;
  name: string;
  description?: string;
};

type TelemetryMachineListItem = {
  id: number;
  name?: string;
  serialNumber?: string;
  modelName?: string;
  isActiveKiosk?: boolean;
};

type TelemetryOrganizationCreateInput = {
  name: string;
  description?: string;
  currency?: string;
  isTest?: boolean;
  enabledModules?: string[];
  isUsedLocalProductBase?: boolean;
  isDocumentUploadEnabled?: boolean;
  contacts?: Array<{
    name: string;
    contact: string;
  }>;
};

type TelemetryProvisionMachineInput = {
  organizationId: number;
  serialNumber: string;
  shipmentDate: string;
  machineModelId?: number;
};

const TOKEN_SKEW_MS = 60_000;
let cachedToken: TelemetryToken | null = null;

const getRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

const getTelemetryEnv = () => ({
  baseUrl: getRequiredEnv("TELEMETRY_API_BASE").replace(/\/$/, ""),
  tokenUrl: getRequiredEnv("TELEMETRY_KEYCLOAK_TOKEN_URL"),
  clientId: getRequiredEnv("TELEMETRY_CLIENT_ID"),
  username: getRequiredEnv("TELEMETRY_SERVICE_USERNAME"),
  password: getRequiredEnv("TELEMETRY_SERVICE_PASSWORD"),
});

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1] || "";
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as {
      exp?: number;
      sub?: string;
    };
  } catch {
    return {};
  }
};

const decodeJwtExpMs = (token: string) => {
  try {
    const payload = decodeJwtPayload(token);
    return payload.exp ? payload.exp * 1000 : Date.now() + 30 * 60 * 1000;
  } catch {
    return Date.now() + 30 * 60 * 1000;
  }
};

const requestToken = async (refreshToken?: string) => {
  const env = getTelemetryEnv();
  const body = new URLSearchParams();
  body.set("client_id", env.clientId);

  if (refreshToken) {
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
  } else {
    body.set("grant_type", "password");
    body.set("username", env.username);
    body.set("password", env.password);
  }

  const response = await fetch(env.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const payload = await response.json();

  if (!response.ok || !payload?.access_token) {
    throw new Error("Telemetry token request failed");
  }

  cachedToken = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAtMs: decodeJwtExpMs(payload.access_token),
  };

  return cachedToken.accessToken;
};

const getAccessToken = async () => {
  if (
    cachedToken?.accessToken &&
    cachedToken.expiresAtMs - TOKEN_SKEW_MS > Date.now()
  ) {
    return cachedToken.accessToken;
  }

  if (cachedToken?.refreshToken) {
    try {
      return await requestToken(cachedToken.refreshToken);
    } catch {
      // fall through to password login
    }
  }

  return requestToken();
};

const telemetryFetch = async <T>(path: string, init?: RequestInit) => {
  const { baseUrl } = getTelemetryEnv();
  let accessToken = await getAccessToken();

  const doRequest = async (token: string) => {
    const response = await fetch(`${baseUrl}/api${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error("Telemetry request failed") as Error & {
        status?: number;
        response?: unknown;
      };
      error.status = response.status;
      error.response = payload;
      throw error;
    }

    return payload as T;
  };

  try {
    return await doRequest(accessToken);
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status !== 401) throw error;

    accessToken = await requestToken();
    return doRequest(accessToken);
  }
};

export const isTelemetryConfigured = () =>
  Boolean(
    process.env.TELEMETRY_API_BASE &&
      process.env.TELEMETRY_KEYCLOAK_TOKEN_URL &&
      process.env.TELEMETRY_CLIENT_ID &&
      process.env.TELEMETRY_SERVICE_USERNAME &&
      process.env.TELEMETRY_SERVICE_PASSWORD,
  );

export const listTelemetryOrganizations = () =>
  telemetryFetch<TelemetryOrganization[]>("/telemetry-organization/organization/list");

export const createTelemetryOrganization = (data: TelemetryOrganizationCreateInput) =>
  telemetryFetch<TelemetryOrganization>("/telemetry-organization/organization/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const listTelemetryMachineSerials = (organizationId: number) =>
  telemetryFetch<TelemetryMachineListItem[]>(
    `/telemetry-machine-control/machine/list-serial-number/all?organizationId=${organizationId}`,
  );

export const getTelemetryMachineStatus = (machineId: number) =>
  telemetryFetch<any>(`/telemetry-machine-control/machine/status/${machineId}`);

export const getTelemetryMachineHome = (machineId: number) =>
  telemetryFetch<any>(`/telemetry-machine-control/machine-main/element/${machineId}`);

export const getTelemetryMachineStorage = (machineId: number) =>
  telemetryFetch<any>(`/telemetry-machine-control/machine/element/${machineId}`);

export const getTelemetryMachinePrices = (machineId: number) =>
  telemetryFetch<any>(`/telemetry-machine-control/price/list/${machineId}`);

export const getTelemetryUserUuid = async () => {
  const token = await getAccessToken();
  return decodeJwtPayload(token).sub || null;
};

export const provisionTelemetryMachineSetup = (
  userUuid: string,
  data: TelemetryProvisionMachineInput,
) =>
  telemetryFetch<any>(
    `/telemetry-machine-control/machine/setup/provision?uuid=${encodeURIComponent(userUuid)}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );

export const changeTelemetryMachineOrganization = (
  machineId: number,
  organizationId: number,
  userUuid: string,
) =>
  telemetryFetch<any>(
    `/telemetry-machine-control/machine/edit/${machineId}/organization/${encodeURIComponent(
      userUuid,
    )}`,
    {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    },
  );

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const resolveTelemetryOrganizationId = async (client: {
  company?: string;
  telemetry_organization_id?: number | null;
}) => {
  if (client.telemetry_organization_id) {
    return client.telemetry_organization_id;
  }

  if (!client.company) return null;

  const organizations = await listTelemetryOrganizations();
  const target = normalizeName(client.company);

  const exact = organizations.find((org) => normalizeName(org.name) === target);
  if (exact) return exact.id;

  const partial = organizations.find((org) => {
    const orgName = normalizeName(org.name);
    return target.includes(orgName) || orgName.includes(target);
  });

  return partial?.id || null;
};

export const resolveTelemetryMachine = async (params: {
  client: { company?: string; telemetry_organization_id?: number | null };
  serialNumber?: string | null;
}) => {
  if (!params.serialNumber) {
    return {
      organizationId: null,
      machineId: null,
      reason: "missing_serial_number",
    };
  }

  const organizationId = await resolveTelemetryOrganizationId(params.client);
  if (!organizationId) {
    return {
      organizationId: null,
      machineId: null,
      reason: "telemetry_organization_not_resolved",
    };
  }

  const machines = await listTelemetryMachineSerials(organizationId);
  const match = machines.find(
    (machine) => String(machine.serialNumber || "").trim() === String(params.serialNumber).trim(),
  );

  if (!match?.id) {
    return {
      organizationId,
      machineId: null,
      reason: "telemetry_machine_not_found_by_serial",
    };
  }

  return {
    organizationId,
    machineId: match.id,
    reason: null,
  };
};

export const findTelemetryMachineBySerial = async (serialNumber: string) => {
  const organizations = await listTelemetryOrganizations();
  const target = String(serialNumber).trim();

  for (const organization of organizations) {
    const machines = await listTelemetryMachineSerials(organization.id);
    const machine = machines.find(
      (item) => String(item.serialNumber || "").trim() === target,
    );

    if (machine?.id) {
      return {
        organizationId: organization.id,
        organizationName: organization.name,
        machine,
      };
    }
  }

  return null;
};
