import type { Client, Machine } from "./strapi";

export type RegistrationDraft = {
  machineId?: string | number;
  serialNumber?: string;
  machineTitle?: string;
  machineTypeName?: string;
  clientId?: string | number;
  company?: string;
  location?: string;
  contactName?: string;
  email?: string;
  messengerType?: "whatsapp";
  messengerCountryCode?: string;
  messengerValue?: string;
  notes?: string;
  password?: string;
  passwordConfirmation?: string;
  authProvider?: "local" | "google";
};

export type PortalUser = {
  id: number;
  username?: string;
  email: string;
  client?: {
    id: string | number;
  } | null;
};

export type PortalSession = {
  user: PortalUser;
  client: Client;
  machines: Machine[];
};

export type PortalMachineSummary = Machine & {
  statusLabel: string;
};

export type PromoCode = {
  id: string | number;
  title?: string;
  code: string;
  discount_type: "PERCENT" | "FIXED";
  amount: number;
  start_at: string;
  end_at: string;
  status?: "draft" | "active" | "expired" | "cancelled";
  notes?: string;
  machine?: Machine | null;
  client?: Client | null;
};
