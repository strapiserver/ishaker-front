import assert from "node:assert/strict";
import test from "node:test";
import { getCurrencySymbol } from "./currency";

test("currency symbols use the configured global currency symbol first", () => {
  assert.equal(getCurrencySymbol({ id: 1, code: "USD", symbol: "US$" }), "US$");
});

test("currency symbols fall back to the JSON mapping", () => {
  assert.equal(getCurrencySymbol({ id: 1, code: "RUB" }), "₽");
  assert.equal(getCurrencySymbol({ id: 2, code: "USD" }), "$");
});

test("currency symbols fall back to the currency code", () => {
  assert.equal(getCurrencySymbol({ id: 1, code: "XYZ" }), "XYZ");
});
