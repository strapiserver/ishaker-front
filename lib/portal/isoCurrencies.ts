import type { Currency } from "../../types/strapi";

export const ISO_CURRENCY_ID_PREFIX = "iso:";

const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });

export const getIsoCurrency = (codeValue: string): Currency | null => {
  const code = codeValue.trim().toUpperCase();
  if (!Intl.supportedValuesOf("currency").includes(code)) return null;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  });
  const parts = formatter.formatToParts(12345.6);
  const symbolIndex = parts.findIndex((part) => part.type === "currency");
  const integerIndex = parts.findIndex((part) => part.type === "integer");

  return {
    id: `${ISO_CURRENCY_ID_PREFIX}${code}`,
    code,
    name: currencyNames.of(code) || code,
    symbol: parts.find((part) => part.type === "currency")?.value || code,
    symbol_position: symbolIndex <= integerIndex ? "before" : "after",
    decimal_digits: formatter.resolvedOptions().maximumFractionDigits,
    rounding: 0,
    thousands_separator:
      parts.find((part) => part.type === "group")?.value || ",",
    decimal_separator:
      parts.find((part) => part.type === "decimal")?.value || ".",
    isActive: true,
  };
};

export const getIsoCurrencies = () =>
  Intl.supportedValuesOf("currency")
    .map(getIsoCurrency)
    .filter((currency): currency is Currency => Boolean(currency));

export const getIsoCodeFromVirtualId = (id: string) =>
  id.startsWith(ISO_CURRENCY_ID_PREFIX)
    ? id.slice(ISO_CURRENCY_ID_PREFIX.length).toUpperCase()
    : null;
