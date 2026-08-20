import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { Client, Machine } from "../../types/strapi";
import {
  addPortalMachineFields,
  withoutMachineNickname,
} from "./machinePrivacy";
import type { PortalSession, PortalUser } from "../../types/portal";
import { readAdminImpersonationUserId } from "../admin/auth";
import {
  requestStrapiRestAsService,
  requestStrapiRestWithJwt,
} from "../../services/server/strapiClient";
import {
  findMachineBySerialBase,
  getMachineSerialBase,
} from "./machineSerial";

const COOKIE_NAME = "ishaker_portal_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const parseCookie = (cookieHeader: string | undefined, name: string) => {
  const cookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(name.length + 1));
};

export const createPortalSessionCookie = (jwt: string) =>
  `${COOKIE_NAME}=${encodeURIComponent(jwt)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

export const clearPortalSessionCookie = () =>
  `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

export const readPortalJwt = (cookieHeader?: string) =>
  parseCookie(cookieHeader, COOKIE_NAME);

export const setPortalSession = (res: NextApiResponse, jwt: string) => {
  res.setHeader("Set-Cookie", createPortalSessionCookie(jwt));
};

export const clearPortalSession = (res: NextApiResponse) => {
  res.setHeader("Set-Cookie", clearPortalSessionCookie());
};

export const fetchPortalUser = async (jwt: string) => {
  const requestUser = () =>
    requestStrapiRestWithJwt<PortalUser>(
      "/api/users/me?populate[0]=client&populate[1]=role",
      jwt,
    );

  try {
    return await requestUser();
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) throw error;
    return requestUser();
  }
};

const fetchPortalUserAsService = (userId: string | number) =>
  requestStrapiRestAsService<PortalUser>(
    `/api/users/${userId}?populate[0]=client&populate[1]=role`,
  );

const normalizeRoleKey = (value?: string) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

export const isProductClientUser = (user?: PortalUser | null) =>
  normalizeRoleKey(user?.role?.type) === "productclient" ||
  normalizeRoleKey(user?.role?.name) === "productclient";

const fetchClientById = async (clientId: string | number) => {
  const params = new URLSearchParams();
  addPortalMachineFields(params, "populate[machines][fields]");
  params.set(
    "populate[machines][populate][machine_type][populate][preview][fields][0]",
    "url",
  );
  params.set(
    "populate[machines][populate][machine_type][populate][preview][fields][1]",
    "formats",
  );
  params.set(
    "populate[machines][populate][machine_type][populate][preview][fields][2]",
    "name",
  );
  params.set("populate[machines][populate][currency]", "*");
  params.set("populate[machines][populate][language]", "*");
  params.set("populate[currency]", "*");
  params.set("populate[machines][sort][0]", "title:ASC");

  return requestStrapiRestAsService<Client>(
    `/api/clients/${clientId}?${params.toString()}`,
  );
};

const withoutPrivateClientFields = (client: Client) => {
  const safeClient = { ...client } as Client & Record<string, unknown>;
  delete safeClient.nayax_token;
  safeClient.machines = (client.machines || []).map((machine) =>
    withoutMachineNickname(machine as Machine & Record<string, unknown>),
  ) as Machine[];
  return safeClient as Client;
};

export const fetchMachineByIdAsService = async (machineId: string | number) => {
  const params = new URLSearchParams();
  addPortalMachineFields(params);
  params.set("populate[0]", "client");
  params.set("populate[1]", "machine_type");
  params.set("populate[2]", "currency");
  params.set("populate[3]", "language");

  return requestStrapiRestAsService<Machine>(
    `/api/machines/${machineId}?${params.toString()}`,
  );
};

export const fetchMachineBySerialAsService = async (serialNumber: string) => {
  const serialBase = getMachineSerialBase(serialNumber);
  const params = new URLSearchParams();
  addPortalMachineFields(params);
  params.set("filters[serial_number][$startsWith]", serialBase);
  params.set("populate[0]", "client");
  params.set("populate[1]", "machine_type");
  params.set("populate[2]", "currency");
  params.set("populate[3]", "language");
  params.set("pagination[pageSize]", "2000");

  const machines = await requestStrapiRestAsService<Machine[]>(
    `/api/machines?${params.toString()}`,
  );

  return findMachineBySerialBase(machines, serialBase);
};

export const resolvePortalSession = async (
  cookieHeader?: string,
): Promise<PortalSession | null> => {
  const credential = readPortalJwt(cookieHeader);
  if (!credential) return null;

  const impersonatedUserId = readAdminImpersonationUserId(credential);
  const user = impersonatedUserId
    ? await fetchPortalUserAsService(impersonatedUserId)
    : await fetchPortalUser(credential);
  if (!user?.id) return null;

  if (!user.client?.id) {
    if (!isProductClientUser(user)) return null;

    return {
      user,
      client: {
        id: 0,
        company: user.username || user.email || "Product Client",
      },
      machines: [],
      access: "product",
    };
  }

  let client: Client;
  try {
    const resolvedClient = await fetchClientById(user.client.id);
    if (!resolvedClient?.id) return null;
    client = withoutPrivateClientFields(resolvedClient);
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) return null;

    console.error(
      "[portal] client details unavailable; keeping authenticated session:",
      error,
    );
    const sessionClient = user.client as {
      id: string | number;
      company?: string;
    };
    client = withoutPrivateClientFields({
      id: sessionClient.id,
      company: sessionClient.company || user.username || user.email || "Client",
      machines: [],
    } as Client);
  }

  return {
    user,
    client,
    machines: (client.machines || []) as Machine[],
    access: isProductClientUser(user) ? "product" : "client",
  };
};

type RequirePortalSessionResult =
  | { session: PortalSession }
  | {
      redirect: {
        destination: string;
        permanent: false;
      };
    };

export const requirePortalSession = async (
  context: GetServerSidePropsContext,
): Promise<RequirePortalSessionResult> => {
  try {
    const session = await resolvePortalSession(context.req.headers.cookie);
    if (session) {
      if (
        session.access === "product" &&
        !context.resolvedUrl.startsWith("/product-lines")
      ) {
        return {
          redirect: {
            destination: "/product-lines",
            permanent: false,
          },
        };
      }
      return { session };
    }
  } catch (error) {
    console.error("[portal] session resolution failed:", error);
  }

  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  };
};

export const getPortalSessionFromApiRequest = async (req: NextApiRequest) => {
  return resolvePortalSession(req.headers.cookie);
};

export const machineBelongsToSessionClient = (
  session: PortalSession,
  machineId: string | number,
) =>
  session.machines.some((machine) => String(machine.id) === String(machineId));

export const assertMachineBelongsToSessionClient = async (
  session: PortalSession,
  machineId: string | number,
) => {
  if (machineBelongsToSessionClient(session, machineId)) {
    return (
      session.machines.find(
        (machine) => String(machine.id) === String(machineId),
      ) || null
    );
  }

  const machine = await fetchMachineByIdAsService(machineId);
  if (
    !machine?.client ||
    String(machine.client.id) !== String(session.client.id)
  ) {
    return null;
  }

  return machine;
};
