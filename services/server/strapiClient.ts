import fs from "fs";
import path from "path";
import { getStrapiBaseUrl } from "../fetchers";
import normalize from "../normalizer";

const AUTH_PROVIDER = "local";
const TOKEN_REFRESH_SKEW_MS = 60_000;

type CachedToken = {
  jwt: string;
  expiresAtMs: number;
};

let cachedToken: CachedToken | null = null;

const readLocalStrapiEnv = () => {
  if (process.env.NODE_ENV === "production") return {};

  try {
    const envPath = path.resolve(process.cwd(), "../strapi/.env");
    const contents = fs.readFileSync(envPath, "utf8");
    return contents.split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return acc;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return acc;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key) acc[key] = value;
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const localStrapiEnv = readLocalStrapiEnv();

const getServiceCredentialCandidates = () => {
  const environmentIdentifier =
    process.env.STRAPI_AUTH_IDENTIFIER ||
    process.env.STRAPI_MACHINE_USER_LOGIN;
  const environmentPassword =
    process.env.STRAPI_AUTH_PASSWORD ||
    process.env.STRAPI_MACHINE_USER_PASSWORD;
  const localIdentifier =
    localStrapiEnv.STRAPI_AUTH_IDENTIFIER ||
    localStrapiEnv.STRAPI_MACHINE_USER_LOGIN;
  const localPassword =
    localStrapiEnv.STRAPI_AUTH_PASSWORD ||
    localStrapiEnv.STRAPI_MACHINE_USER_PASSWORD;
  const candidates = [
    { identifier: environmentIdentifier, password: environmentPassword },
    { identifier: localIdentifier, password: localPassword },
  ].filter(
    (
      candidate,
    ): candidate is {
      identifier: string;
      password: string;
    } => Boolean(candidate.identifier && candidate.password),
  );
  const uniqueCandidates = candidates.filter(
    (candidate, index) =>
      candidates.findIndex(
        (item) =>
          item.identifier === candidate.identifier &&
          item.password === candidate.password,
      ) === index,
  );

  if (!uniqueCandidates.length) {
    throw new Error(
      "Missing STRAPI_AUTH_IDENTIFIER/STRAPI_AUTH_PASSWORD or STRAPI_MACHINE_USER_LOGIN/STRAPI_MACHINE_USER_PASSWORD.",
    );
  }

  return uniqueCandidates;
};

const decodeJwtExpMs = (jwt: string) => {
  try {
    const payloadRaw = jwt.split(".")[1];
    if (!payloadRaw) return Date.now() + 30 * 60 * 1000;

    const base64 = payloadRaw.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    if (!payload.exp || !Number.isFinite(payload.exp)) {
      return Date.now() + 30 * 60 * 1000;
    }
    return payload.exp * 1000;
  } catch {
    return Date.now() + 30 * 60 * 1000;
  }
};

const requestGraphql = async <T = any>(
  query: string,
  variables?: Record<string, any>,
  jwt?: string,
) => {
  const response = await fetch(`${getStrapiBaseUrl()}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();

  if (payload?.data && typeof payload.data === "object") {
    return payload.data as T;
  }

  if (!response.ok || payload.errors?.length) {
    const error = new Error("Strapi GraphQL request failed") as Error & {
      response?: typeof payload;
      status?: number;
    };
    error.response = payload;
    error.status = response.status;
    throw error;
  }

  return payload.data as T;
};

const loginToStrapi = async () => {
  const candidates = getServiceCredentialCandidates();
  let lastStatus = 0;

  for (const { identifier, password } of candidates) {
    const response = await fetch(`${getStrapiBaseUrl()}/api/auth/local`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier,
        password,
        provider: AUTH_PROVIDER,
      }),
    });
    const payload = await response.json().catch(() => null);
    const jwt = payload?.jwt;
    lastStatus = response.status;

    if (!response.ok || !jwt) continue;

    cachedToken = {
      jwt,
      expiresAtMs: decodeJwtExpMs(jwt),
    };

    return jwt;
  }

  throw new Error(
    `Strapi service login failed${lastStatus ? ` (${lastStatus})` : ""}.`,
  );
};

const getStrapiJwt = async (forceRefresh = false) => {
  const now = Date.now();
  const tokenValid = Boolean(
    !forceRefresh &&
      cachedToken?.jwt &&
      cachedToken.expiresAtMs - TOKEN_REFRESH_SKEW_MS > now,
  );

  if (tokenValid) return cachedToken!.jwt;
  return loginToStrapi();
};

export const requestStrapiAsService = async <T = any>(
  query: string,
  variables?: Record<string, any>,
) => {
  let jwt = await getStrapiJwt(false);

  try {
    return await requestGraphql<T>(query, variables, jwt);
  } catch {
    jwt = await getStrapiJwt(true);
    return requestGraphql<T>(query, variables, jwt);
  }
};

const requestStrapiRest = async <T = any>(
  path: string,
  init?: RequestInit,
  jwt?: string,
) => {
  const isMultipart =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(`${getStrapiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(!isMultipart ? { "content-type": "application/json" } : {}),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.error) {
    const error = new Error("Strapi REST request failed") as Error & {
      response?: any;
      status?: number;
    };
    error.response = payload;
    error.status = response.status;
    throw error;
  }

  return normalize(payload) as T;
};

export const requestStrapiRestAsService = async <T = any>(
  path: string,
  init?: RequestInit,
) => {
  const method = (init?.method || "GET").toUpperCase();
  const allowPublicReadFallback = method === "GET";
  let jwt: string;

  try {
    jwt = await getStrapiJwt(false);
  } catch (error) {
    if (!allowPublicReadFallback) throw error;
    return requestStrapiRest<T>(path, init);
  }

  try {
    return await requestStrapiRest<T>(path, init, jwt);
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status !== 401 && status !== 403) throw error;

    try {
      jwt = await getStrapiJwt(true);
      return requestStrapiRest<T>(path, init, jwt);
    } catch (refreshError) {
      if (!allowPublicReadFallback) throw refreshError;
      return requestStrapiRest<T>(path, init);
    }
  }
};

export const requestStrapiRestWithJwt = async <T = any>(
  path: string,
  jwt: string,
  init?: RequestInit,
) => requestStrapiRest<T>(path, init, jwt);
