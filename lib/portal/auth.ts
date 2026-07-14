import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { Client, Machine } from "../../types/strapi";
import type { PortalSession, PortalUser } from "../../types/portal";
import { requestStrapiRestAsService, requestStrapiRestWithJwt } from "../../services/server/strapiClient";

const COOKIE_NAME = "ishaker_portal_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

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

export const readPortalJwt = (cookieHeader?: string) => parseCookie(cookieHeader, COOKIE_NAME);

export const setPortalSession = (res: NextApiResponse, jwt: string) => {
  res.setHeader("Set-Cookie", createPortalSessionCookie(jwt));
};

export const clearPortalSession = (res: NextApiResponse) => {
  res.setHeader("Set-Cookie", clearPortalSessionCookie());
};

export const fetchPortalUser = async (jwt: string) => {
  return requestStrapiRestWithJwt<PortalUser>(
    "/api/users/me?populate[0]=client&populate[1]=role",
    jwt,
  );
};

export const isProductClientUser = (user?: PortalUser | null) =>
  user?.role?.type === "product_client" || user?.role?.name === "Product Client";

const fetchClientById = async (clientId: string | number) => {
  const params = new URLSearchParams();
  params.set("populate[machines][populate][0]", "machine_type");
  params.set("populate[machines][sort][0]", "title:ASC");

  return requestStrapiRestAsService<Client>(
    `/api/clients/${clientId}?${params.toString()}`,
  );
};

export const fetchMachineByIdAsService = async (machineId: string | number) => {
  const params = new URLSearchParams();
  params.set("populate[0]", "client");
  params.set("populate[1]", "machine_type");

  return requestStrapiRestAsService<Machine>(
    `/api/machines/${machineId}?${params.toString()}`,
  );
};

export const fetchMachineBySerialAsService = async (serialNumber: string) => {
  const params = new URLSearchParams();
  params.set("filters[serial_number][$eq]", serialNumber);
  params.set("populate[0]", "client");
  params.set("populate[1]", "machine_type");
  params.set("pagination[pageSize]", "1");

  const machines = await requestStrapiRestAsService<Machine[]>(
    `/api/machines?${params.toString()}`,
  );

  return machines[0] || null;
};

export const resolvePortalSession = async (
  cookieHeader?: string,
): Promise<PortalSession | null> => {
  const jwt = readPortalJwt(cookieHeader);
  if (!jwt) return null;

  const user = await fetchPortalUser(jwt);
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

  const client = await fetchClientById(user.client.id);
  if (!client?.id) return null;

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
) => session.machines.some((machine) => String(machine.id) === String(machineId));

export const assertMachineBelongsToSessionClient = async (
  session: PortalSession,
  machineId: string | number,
) => {
  if (machineBelongsToSessionClient(session, machineId)) {
    return session.machines.find((machine) => String(machine.id) === String(machineId)) || null;
  }

  const machine = await fetchMachineByIdAsService(machineId);
  if (!machine?.client || String(machine.client.id) !== String(session.client.id)) {
    return null;
  }

  return machine;
};
