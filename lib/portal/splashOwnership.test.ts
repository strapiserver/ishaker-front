import assert from "node:assert/strict";
import test from "node:test";
import { requestWithSplashOwnershipFallback } from "./splashOwnership";

const ownershipParams = () => {
  const params = new URLSearchParams();
  params.set("filters[id][$eq]", "42");
  params.set("filters[$or][0][author][username][$eq]", "root");
  params.set("filters[$or][1][author][id][$eq]", "7");
  return params;
};

test("retries without splash ownership filters when an older Strapi returns 500", async () => {
  const queries: string[] = [];
  let warned = false;
  const result = await requestWithSplashOwnershipFallback(
    ownershipParams(),
    async (params) => {
      queries.push(params.toString());
      if (queries.length === 1) throw { status: 500 };
      return [{ id: 42 }];
    },
    () => {
      warned = true;
    },
  );

  assert.deepEqual(result, [{ id: 42 }]);
  assert.equal(queries.length, 2);
  assert.match(queries[0], /author/);
  assert.doesNotMatch(queries[1], /author/);
  assert.match(queries[1], /filters%5Bid%5D%5B%24eq%5D=42/);
  assert.equal(warned, true);
});

test("removes a root-only splash ownership filter on compatibility retry", async () => {
  const params = new URLSearchParams();
  params.set("filters[name][$startsWithi]", "color ");
  params.set("filters[author][username][$eq]", "root");
  const queries: string[] = [];

  await requestWithSplashOwnershipFallback(params, async (query) => {
    queries.push(query.toString());
    if (queries.length === 1) throw { status: 500 };
    return [];
  });

  assert.match(queries[0], /author/);
  assert.doesNotMatch(queries[1], /author/);
  assert.match(queries[1], /name/);
});

test("does not hide non-compatibility failures", async () => {
  const expected = { status: 401 };
  let attempts = 0;

  await assert.rejects(
    requestWithSplashOwnershipFallback(ownershipParams(), async () => {
      attempts += 1;
      throw expected;
    }),
    (error) => error === expected,
  );
  assert.equal(attempts, 1);
});
