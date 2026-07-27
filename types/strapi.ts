export type Machine = {
  id: string | number;
  type?: "small" | "big";
  status?: "new" | "ready" | "shipped" | "working" | "error" | "offline";
  title?: string;
  hostname?: string;
  description?: string;
  context?: string;
  anydesk_id?: string;
  tailscale_ip?: string;
  tailscale_hostname?: string;
  ssh_user?: string;
  ssh_port?: number;
  serial_number: string;
  unity_version?: string;
  ssd_version?: string;
  bootstrap_version?: string;
  last_seen_at?: string;
  country?: string;
  state_region?: string;
  city?: string;
  location?: string;
  admin_comment?: string;
  product_lines?: Array<{
    id: string | number;
    name?: string;
    isActive?: boolean;
  }>;
  client?: Client | null;
  machine_type?: {
    id: string | number;
    name?: string;
    preview?: {
      id: string | number;
      name?: string;
      url?: string;
      formats?: Record<
        string,
        {
          url?: string;
          width?: number;
          height?: number;
        }
      > | null;
    } | null;
  } | null;
  currency?: Currency | null;
  nayax_terminal_id?: string | null;
  language?: {
    id: string | number;
    code: string;
    name: string;
    native_name?: string | null;
  } | null;
};

export type Currency = {
  id: string | number;
  code: string;
  name?: string | null;
  symbol?: string | null;
  symbol_position?: "before" | "after";
  decimal_digits?: number;
  rounding?: number | string | null;
  thousands_separator?: string | null;
  decimal_separator?: string | null;
  isActive?: boolean;
};

export type ClientContact =
  | {
      __typename?: "ComponentTelegramTelegram";
      telegram?: string;
    }
  | {
      __typename?: "ComponentWhatsappWhatsapp";
      whatsapp?: string;
    }
  | {
      __typename?: string;
      [key: string]: unknown;
    };

export type Client = {
  id: string | number;
  company: string;
  portal_email?: string | null;
  portal_access_enabled?: boolean;
  portal_auth_provider?: "local" | "google" | "apple" | "facebook";
  telemetry_organization_id?: number | null;
  country?: string;
  state?: string;
  city?: string;
  status?: "admin" | "client" | "blocked";
  contact?: ClientContact[];
  machines?: Machine[];
  currency?: Currency | null;
  nayax_actor_id?: string | null;
  nayax_status?: "unconfigured" | "ok" | "error";
  nayax_error?: string | null;
  nayax_last_sync_at?: string | null;
};

export type Sale = {
  id: string | number;
  nayax_transaction_id?: string | null;
  nayax_terminal_id?: string | null;
  machine?: Machine | null;
  amount?: number | string | null;
  currency?: Currency | null;
  currency_code?: string | null;
  payment_method?: string | null;
  card_brand?: string | null;
  product_name?: string | null;
  status?: "authorized" | "settled" | "refunded" | "declined" | "unknown";
  occurred_at?: string | null;
};

export type MachineLookupResponse = {
  machine: Machine | null;
  client: Client | null;
};
