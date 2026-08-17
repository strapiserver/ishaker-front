import assert from "node:assert/strict";
import test from "node:test";
import { buildDoorKey, utcDateVector } from "./doorKey";

test("buildDoorKey matches the kiosk test vector byte-for-byte", () => {
  const result = buildDoorKey("002", {
    now: new Date("2026-08-15T07:42:16.712Z"),
  });

  assert.equal(
    result.payload,
    "KEY-ppvfpE1UVXRNakF5TmkxeupNQGopgHgQ1ljtzse13LI=",
  );
  assert.equal(result.vector, "08-15-2026");
  assert.equal(result.validUntil, "2026-08-15T23:59:59.999Z");
});

test("utc date and admin day offsets are evaluated in UTC", () => {
  const now = new Date("2026-08-15T23:30:00.000-04:00");
  assert.equal(utcDateVector(now), "08-16-2026");
  assert.equal(buildDoorKey("002", { now, dayOffset: -1 }).vector, "08-15-2026");
  assert.equal(buildDoorKey("002", { now, dayOffset: 1 }).vector, "08-17-2026");
});
