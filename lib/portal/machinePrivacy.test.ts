import assert from "node:assert/strict";
import test from "node:test";
import {
  addPortalMachineFields,
  withoutMachineNickname,
} from "./machinePrivacy";

test("portal machine queries never request the nickname field", () => {
  const params = addPortalMachineFields(new URLSearchParams());
  const requestedFields = Array.from(params.values());

  assert.equal(requestedFields.includes("nickname"), false);
  assert.equal(requestedFields.includes("title"), true);
  assert.equal(requestedFields.includes("serial_number"), true);
});

test("portal machine payloads discard a nickname returned by an older API", () => {
  assert.deepEqual(
    withoutMachineNickname({ id: 7, title: "Machine 7", nickname: "hidden" }),
    { id: 7, title: "Machine 7" },
  );
});
