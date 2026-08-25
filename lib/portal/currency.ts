import type { Currency } from "../../types/strapi";
import currencySymbols from "./currency-symbols.json";

const CURRENCY_SYMBOLS = currencySymbols as Record<string, string>;

export const DEFAULT_CURRENCY: Currency = {
  id: 0,
  code: "USD",
  name: "US Dollar",
  symbol_position: "before",
  decimal_digits: 2,
  thousands_separator: ",",
  decimal_separator: ".",
};

export const resolveCurrency = (
  currency?: Currency | null,
  fallback?: Currency | null,
) => currency || fallback || DEFAULT_CURRENCY;

export const getCurrencySymbol = (currency?: Currency | null) => {
  const resolved = resolveCurrency(currency);
  const code = resolved.code.trim().toUpperCase();
  return resolved.symbol?.trim() || CURRENCY_SYMBOLS[code] || code;
};

export const formatMoney = (
  value: number | string | null | undefined,
  currency?: Currency | null,
) => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  const resolved = resolveCurrency(currency);
  const digits = Number.isInteger(resolved.decimal_digits)
    ? Math.max(0, Number(resolved.decimal_digits))
    : 2;
  const configuredRounding = Number(resolved.rounding);
  const rounded =
    Number.isFinite(configuredRounding) && configuredRounding > 0
      ? Math.round(amount / configuredRounding) * configuredRounding
      : amount;
  const sign = rounded < 0 ? "-" : "";
  const fixed = Math.abs(rounded).toFixed(digits);
  const [integer, fraction] = fixed.split(".");
  const grouped = integer.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    resolved.thousands_separator ?? ",",
  );
  const number =
    fraction === undefined
      ? grouped
      : `${grouped}${resolved.decimal_separator ?? "."}${fraction}`;
  const symbol = getCurrencySymbol(resolved);
  return resolved.symbol_position === "after"
    ? `${sign}${number} ${symbol}`
    : `${sign}${symbol}${number}`;
};
