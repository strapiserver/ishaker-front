import type { IconType } from "react-icons";
import { CgServer } from "react-icons/cg";
import { GrServer, GrVend } from "react-icons/gr";
import { LuIceCreamBowl } from "react-icons/lu";
import { PiOvenDuotone } from "react-icons/pi";

type MachineTypeIconProps = {
  type?: string | null;
};

const normalizeMachineType = (type?: string | null) =>
  type?.trim().toLowerCase().replace(/\s+/g, " ") || "";

const getMachineTypeIcon = (type?: string | null): IconType => {
  switch (normalizeMachineType(type)) {
    case "shaker s":
      return PiOvenDuotone;
    case "shaker touch":
    case "shaket touch":
      return GrServer;
    case "milkshaker":
      return LuIceCreamBowl;
    case "server":
      return CgServer;
    default:
      return GrVend;
  }
};

export function MachineTypeIcon({ type }: MachineTypeIconProps) {
  const Icon = getMachineTypeIcon(type);
  return <Icon />;
}
