import { beforeAll, describe, expect, it } from "vitest";

let auth: typeof import("./auth.js");

beforeAll(async () => {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    "postgresql://nested:nested@localhost:5432/nested?schema=public";
  auth = await import("./auth.js");
});

describe("authentication primitives", () => {
  it("normalizes usernames for case-insensitive identity lookup", () => {
    expect(auth.normalizeUsername("  Nested_User ")).toBe("nested_user");
  });

  it("accepts the supported username format", () => {
    expect(auth.usernamePattern.test("nested_user42")).toBe(true);
    expect(auth.usernamePattern.test("nested-user")).toBe(false);
    expect(auth.usernamePattern.test("x")).toBe(false);
  });

  it("hashes and verifies passwords without storing plaintext", async () => {
    const password = "correct horse battery staple";
    const hash = await auth.hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(auth.verifyPassword(hash, password)).resolves.toBe(true);
    await expect(auth.verifyPassword(hash, "incorrect password")).resolves.toBe(
      false
    );
  });
});
