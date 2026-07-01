import type { Client } from "../../types/strapi";

export type AdminContact = {
  type: "telegram" | "whatsapp";
  label: string;
  href: string;
};

const formatTelegram = (value?: string) => {
  const trimmed = value?.trim() || "";
  const clean = (trimmed.match(/@([A-Za-z0-9_]+)/)?.[1] || trimmed.replace(/^@/, ""))
    .trim()
    .replace(/\s+/g, "");

  if (!clean) return null;
  return { label: `@${clean}`, href: `https://t.me/${clean}` };
};

const formatWhatsapp = (value?: string) => {
  const digits = value?.replace(/\D/g, "") || "";
  if (!digits) return null;

  const normalized =
    value?.trim().startsWith("+") || digits.startsWith("1") ? digits : `1${digits}`;

  return { label: `+${normalized}`, href: `https://wa.me/${normalized}` };
};

export const getClientContacts = (client: Client) => {
  const contacts = client.contact || [];

  return contacts
    .map((contact) => {
      if ("telegram" in contact && typeof contact.telegram === "string") {
        const telegram = formatTelegram(contact.telegram);
        return telegram ? { type: "telegram" as const, ...telegram } : null;
      }

      if ("whatsapp" in contact && typeof contact.whatsapp === "string") {
        const whatsapp = formatWhatsapp(contact.whatsapp);
        return whatsapp ? { type: "whatsapp" as const, ...whatsapp } : null;
      }

      return null;
    })
    .filter(Boolean) as AdminContact[];
};

export const getClientLocation = (client: Client) =>
  [client.country, client.state, client.city].filter(Boolean).join(", ");

export const displayValue = (value?: string | null) => value || "Not set";
