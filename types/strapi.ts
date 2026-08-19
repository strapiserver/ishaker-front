export type MachineReadinessVerdict = "SHIP" | "REVIEW" | "DO_NOT_SHIP";

export type MachineReadiness = {
  at?: string | null;
  verdict: MachineReadinessVerdict;
  counts?: {
    ok?: number;
    warn?: number;
    fail?: number;
  } | null;
  failed?: string[] | null;
  warned?: string[] | null;
  detail?: Record<string, string> | null;
};

export type Patch = {
  id: string | number;
  slug?: string | null;
};

export type Language = {
  id: string | number;
  code: string;
  name: string;
  native_name?: string | null;
  app_name?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
  sort_order?: number | null;
};

export type TranslationSet = {
  id: string | number;
  name: string;
  slug?: string | null;
  language?: Language | null;
  client?: Pick<Client, "id" | "company"> | null;
  is_root?: boolean;
  based_on?: TranslationSet | null;
  isActive?: boolean;
  notes?: string | null;
};

export type Machine = {
  id: string | number;
  has_door_lock?: boolean | null;
  type?: "small" | "big";
  status?: "new" | "ready" | "shipped" | "working" | "error" | "offline";
  title?: string;
  nickname?: string | null;
  hostname?: string;
  description?: string;
  context?: string;
  anydesk_id?: string;
  rustdesk_id?: string | null;
  rustdesk_password?: string | null;
  tailscale_ip?: string;
  tailscale_hostname?: string;
  ssh_user?: string;
  ssh_port?: number;
  serial_number: string;
  unity_version?: string;
  ssd_version?: string;
  bootstrap_version?: string;
  last_seen_at?: string;
  health?: {
    at?: string | null;
    app?: {
      uptime_s?: number | null;
      frames_ok?: boolean | null;
      // Written by fleetpulse build_health(): "ok" | "starting" | "stalled" | "down".
      // "starting" is a kiosk inside its first heartbeat — no frames counted yet, which
      // is not the same thing as broken. Absent on readings taken before 2026-08-18.
      state?: "ok" | "starting" | "stalled" | "down" | null;
    } | null;
    terminal?: {
      card?: boolean | null;
      at?: string | null;
    } | null;
    water?: {
      current?: number | null;
      max?: number | null;
      low?: boolean | null;
      counter_reset_at?: string | null;
    } | null;
    cups?: {
      current?: number | null;
      low?: boolean | null;
      tracked?: boolean | null;
      counter_reset_at?: string | null;
    } | null;
    containers?: Array<{
      position?: number | null;
      current?: number | null;
      max?: number | null;
      servings_left?: number | null;
      runs_out?: boolean | null;
      product?: string | null;
      counter_reset_at?: string | null;
    }> | null;
    errors?: Array<{
      code?: number | null;
      at?: string | null;
    }> | null;
  } | null;
  fleet_status?: {
    patch_id?: string | number | null;
    device_serial?: string | null;
    identity_at?: string | null;
    scanner_ok?: boolean | null;
    scanner_dev?: string | null;
    media_keys?: {
      checked?: number;
      missing?: string[];
    } | null;
    [key: string]: unknown;
  } | null;
  patch?: Patch | null;
  readiness?: MachineReadiness | null;
  country?: string;
  state_region?: string;
  city?: string;
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
    container_count?: number | null;
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
  language?: Language | null;
  translation_set?: TranslationSet | null;
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
