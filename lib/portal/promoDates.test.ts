import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPromoCountdown,
  formatPromoDuration,
  getPromoEndTime,
  getPromoStartTime,
  isPromoExpired,
  toDateTimeLocalValue,
} from "./promoDates";

test("start shortcuts use local calendar boundaries", () => {
  const morning = new Date(2026, 7, 25, 9, 17, 42);
  assert.equal(toDateTimeLocalValue(getPromoStartTime("now", morning)), "2026-08-25T09:17");
  assert.equal(toDateTimeLocalValue(getPromoStartTime("next-noon", morning)), "2026-08-25T12:00");
  assert.equal(toDateTimeLocalValue(getPromoStartTime("next-midnight", morning)), "2026-08-26T00:00");
  assert.equal(toDateTimeLocalValue(getPromoStartTime("after-1h", morning)), "2026-08-25T10:17");
});

test("next noon advances to tomorrow once today's noon has passed", () => {
  const afternoon = new Date(2026, 7, 25, 14, 0);
  assert.equal(
    toDateTimeLocalValue(getPromoStartTime("next-noon", afternoon)),
    "2026-08-26T12:00",
  );
});

test("end shortcuts are calculated from the selected start", () => {
  const start = "2026-08-25T09:17";
  assert.equal(toDateTimeLocalValue(getPromoEndTime(start, "10m")!), "2026-08-25T09:27");
  assert.equal(toDateTimeLocalValue(getPromoEndTime(start, "6h")!), "2026-08-25T15:17");
  assert.equal(toDateTimeLocalValue(getPromoEndTime(start, "24h")!), "2026-08-26T09:17");
  assert.equal(toDateTimeLocalValue(getPromoEndTime(start, "3d")!), "2026-08-28T09:17");
  assert.equal(toDateTimeLocalValue(getPromoEndTime(start, "1w")!), "2026-09-01T09:17");
});

test("one month clamps to the last day of a shorter month", () => {
  assert.equal(
    toDateTimeLocalValue(getPromoEndTime("2026-01-31T12:30", "1mo")!),
    "2026-02-28T12:30",
  );
});

test("end shortcuts reject an absent or invalid start", () => {
  assert.equal(getPromoEndTime("", "10m"), null);
  assert.equal(getPromoEndTime("not-a-date", "10m"), null);
});

test("promo durations use readable day, hour, and minute units", () => {
  assert.equal(
    formatPromoDuration("2026-04-08T12:30", "2026-04-18T12:30"),
    "10 days",
  );
  assert.equal(
    formatPromoDuration("2026-04-08T12:30", "2026-04-08T17:30"),
    "5 hours",
  );
  assert.equal(
    formatPromoDuration("2026-04-08T12:30", "2026-04-09T14:00"),
    "1 day 1 hour",
  );
  assert.equal(
    formatPromoDuration("2026-04-08T12:30", "2026-04-08T12:40"),
    "10 minutes",
  );
});

test("promo countdown is based on now instead of the full promo duration", () => {
  const start = "2026-04-08T12:00:00.000Z";
  const end = "2026-04-08T12:10:00.000Z";

  assert.equal(
    formatPromoCountdown(start, end, Date.parse("2026-04-08T12:05:00.000Z")),
    "5 minutes left",
  );
  assert.equal(
    formatPromoCountdown(start, end, Date.parse("2026-04-08T11:00:00.000Z")),
    "1 hour until start",
  );
  assert.equal(
    formatPromoCountdown(start, end, Date.parse("2026-04-08T12:10:00.000Z")),
    null,
  );
  assert.equal(isPromoExpired(end, Date.parse("2026-04-08T12:10:00.000Z")), true);
});
