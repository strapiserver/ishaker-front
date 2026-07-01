import crypto from "crypto";
import type { GetServerSidePropsContext, NextApiResponse } from "next";

const COOKIE_NAME = "ishaker_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const getAdminPassword = () => {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Missing ADMIN_PASSWORD in the frontend server environment.");
  }
  return password;
};

const sign = (value: string) =>
  crypto.createHmac("sha256", getAdminPassword()).update(value).digest("hex");

const safeEqual = (a: string, b: string) => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const verifyAdminPassword = (password: string) =>
  safeEqual(password, getAdminPassword());

export const createAdminSessionCookie = () => {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;

  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
};

export const clearAdminSessionCookie = () =>
  `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

export const isValidAdminSession = (cookieHeader?: string) => {
  const rawCookie = cookieHeader
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`));

  if (!rawCookie) return false;

  const token = decodeURIComponent(rawCookie.slice(COOKIE_NAME.length + 1));
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [subject, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (subject !== "admin" || !Number.isFinite(expiresAt)) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  return safeEqual(signature, sign(`${subject}.${expiresAtRaw}`));
};

export const requireAdminSession = (context: GetServerSidePropsContext) => {
  if (isValidAdminSession(context.req.headers.cookie)) return null;

  return {
    redirect: {
      destination: "/admin/login",
      permanent: false,
    },
  };
};

export const setAdminSession = (res: NextApiResponse) => {
  res.setHeader("Set-Cookie", createAdminSessionCookie());
};

export const clearAdminSession = (res: NextApiResponse) => {
  res.setHeader("Set-Cookie", clearAdminSessionCookie());
};
