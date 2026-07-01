import { Button, Link } from "@chakra-ui/react";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import type { AdminContact } from "./utils";

type ContactButtonProps = {
  contact: AdminContact;
};

export function ContactButton({ contact }: ContactButtonProps) {
  const isTelegram = contact.type === "telegram";

  return (
    <Button
      as={Link}
      href={contact.href}
      isExternal
      leftIcon={isTelegram ? <FaTelegramPlane /> : <FaWhatsapp />}
      rightIcon={<FiExternalLink />}
      bg={isTelegram ? "rgba(99, 179, 237, 0.14)" : "rgba(118, 248, 95, 0.14)"}
      color={isTelegram ? "blue.200" : "acid.300"}
      border="1px solid"
      borderColor={isTelegram ? "blue.700" : "acid.800"}
      borderRadius="8px"
      _hover={{
        textDecoration: "none",
        bg: isTelegram ? "rgba(99, 179, 237, 0.2)" : "rgba(118, 248, 95, 0.2)",
      }}
    >
      {contact.label}
    </Button>
  );
}
