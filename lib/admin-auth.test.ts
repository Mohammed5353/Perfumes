import assert from "node:assert/strict";
import { test } from "node:test";

import { getAdminApiKeyFromHeaders, isValidAdminApiKey } from "./admin-auth";

test("extracts x-api-key header values", () => {
  const headers = new Headers({ "x-api-key": "secret-key" });

  assert.equal(getAdminApiKeyFromHeaders(headers), "secret-key");
});

test("extracts bearer tokens from authorization headers", () => {
  const headers = new Headers({ authorization: "Bearer secret-key" });

  assert.equal(getAdminApiKeyFromHeaders(headers), "secret-key");
});

test("validates configured admin api keys", () => {
  process.env.ADMIN_API_KEY = "secret-key";

  assert.equal(isValidAdminApiKey("secret-key"), true);
  assert.equal(isValidAdminApiKey("wrong-key"), false);
});
