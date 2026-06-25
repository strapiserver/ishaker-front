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
};

export type Client = {
  id: string | number;
  company: string;
  country?: string;
  state?: string;
  city?: string;
  machines?: Machine[];
};

export type MachineLookupResponse = {
  machine: Machine | null;
  client: Client | null;
};
