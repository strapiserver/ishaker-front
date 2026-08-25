import assert from "node:assert/strict";
import test from "node:test";
import {
  freeModeStateFromMachine,
  parseFreeModeMinutes,
} from "../freeMode";

test("parseFreeModeMinutes accepts forever and the documented limits", () => {
  assert.equal(parseFreeModeMinutes(""), 0);
  assert.equal(parseFreeModeMinutes(0), 0);
  assert.equal(parseFreeModeMinutes("45"), 45);
  assert.equal(parseFreeModeMinutes(3600), 3600);
});

test("parseFreeModeMinutes rejects invalid minute values", () => {
  assert.equal(parseFreeModeMinutes(-1), null);
  assert.equal(parseFreeModeMinutes(3601), null);
  assert.equal(parseFreeModeMinutes(1.5), null);
  assert.equal(parseFreeModeMinutes("not-a-number"), null);
  assert.equal(parseFreeModeMinutes(true), null);
});

test("freeModeStateFromMachine calculates a finite server-side countdown", () => {
  const now = Date.parse("2026-08-23T18:05:00.000Z");
  const state = freeModeStateFromMachine(
    {
      free_mode: true,
      free_mode_minutes: 45,
      free_mode_started_at: "2026-08-23T18:04:00.000Z",
      free_mode_rev: 7,
      free_mode_source: "machine",
    },
    now,
  );

  assert.deepEqual(state, {
    enabled: true,
    minutes: 45,
    remainingSeconds: 44 * 60,
    startedAt: "2026-08-23T18:04:00.000Z",
    rev: 7,
    source: "machine",
    expired: false,
  });
});

test("freeModeStateFromMachine presents an elapsed window as disabled", () => {
  const state = freeModeStateFromMachine(
    {
      free_mode: true,
      free_mode_minutes: 15,
      free_mode_started_at: "2026-08-23T18:00:00.000Z",
    },
    Date.parse("2026-08-23T18:16:00.000Z"),
  );

  assert.equal(state.enabled, false);
  assert.equal(state.expired, true);
  assert.equal(state.remainingSeconds, 0);
});

test("freeModeStateFromMachine keeps zero minutes enabled forever", () => {
  const state = freeModeStateFromMachine({
    free_mode: true,
    free_mode_minutes: 0,
    free_mode_started_at: null,
    free_mode_source: "portal",
  });

  assert.equal(state.enabled, true);
  assert.equal(state.remainingSeconds, null);
  assert.equal(state.expired, false);
});
