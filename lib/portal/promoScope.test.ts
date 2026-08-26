import assert from "node:assert/strict";
import test from "node:test";
import { hasPromoCodeScopeConflict } from "./promoScope";

const promos = [
  { code: "SAVE20", machine: { id: 1 } },
  { code: "WELCOME", machine: null },
];

test("the same promo code is allowed on different specific machines", () => {
  assert.equal(hasPromoCodeScopeConflict(promos, "save20", 2), false);
});

test("the same promo code is rejected on the same machine", () => {
  assert.equal(hasPromoCodeScopeConflict(promos, "save20", 1), true);
});

test("an all-machines promo conflicts with every machine in that client", () => {
  assert.equal(hasPromoCodeScopeConflict(promos, "WELCOME", 2), true);
  assert.equal(hasPromoCodeScopeConflict(promos, "SAVE20", null), true);
});

test("different promo codes do not conflict", () => {
  assert.equal(hasPromoCodeScopeConflict(promos, "OTHER", 1), false);
});
