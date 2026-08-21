const PORTAL_MACHINE_FIELDS = [
  "status",
  "title",
  "hostname",
  "description",
  "context",
  "anydesk_id",
  "tailscale_ip",
  "tailscale_hostname",
  "ssh_user",
  "ssh_port",
  "serial_number",
  "unity_version",
  "ssd_version",
  "last_seen_at",
  "country",
  "state_region",
  "city",
  "rustdesk_id",
  "rustdesk_password",
  "telemetry_reg_code",
  "fleet_status",
  "nayax_terminal_id",
  "controller_fw",
  "controller_fw_status",
  "readiness",
  "health",
  "has_door_lock",
] as const;

const PORTAL_MACHINE_INVENTORY_FIELDS = [
  "water_type",
  "water_amount_liters",
  "cups_amount",
] as const;

export const addPortalMachineFields = (
  params: URLSearchParams,
  keyPrefix = "fields",
  includeInventory = false,
) => {
  const fields = includeInventory
    ? [...PORTAL_MACHINE_FIELDS, ...PORTAL_MACHINE_INVENTORY_FIELDS]
    : PORTAL_MACHINE_FIELDS;
  fields.forEach((field, index) =>
    params.set(`${keyPrefix}[${index}]`, field),
  );
  return params;
};

export const withoutMachineNickname = <T extends Record<string, unknown>>(
  machine: T,
) => {
  const { nickname: _nickname, ...safeMachine } = machine;
  return safeMachine;
};
