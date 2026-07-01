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
  admin_comment?: string;
  client?: Client | null;
  machine_type?: {
    id: string | number;
    name?: string;
  } | null;
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
  country?: string;
  state?: string;
  city?: string;
  status?: "admin" | "client" | "blocked";
  contact?: ClientContact[];
  machines?: Machine[];
};

export type MachineLookupResponse = {
  machine: Machine | null;
  client: Client | null;
};
