import { describe, expect, it } from "vitest";

import { isCronAuthorized } from "./cron-auth";

describe("isCronAuthorized", () => {
  it("acepta el bearer correcto", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret", "production")).toBe(true);
  });

  it("rechaza un bearer incorrecto o ausente", () => {
    expect(isCronAuthorized("Bearer otro", "s3cret", "production")).toBe(false);
    expect(isCronAuthorized(null, "s3cret", "production")).toBe(false);
    expect(isCronAuthorized("s3cret", "s3cret", "production")).toBe(false);
  });

  it("sin CRON_SECRET bloquea en produccion", () => {
    expect(isCronAuthorized(null, undefined, "production")).toBe(false);
    expect(isCronAuthorized(null, "", "production")).toBe(false);
  });

  it("sin CRON_SECRET permite en desarrollo", () => {
    expect(isCronAuthorized(null, undefined, "development")).toBe(true);
  });
});
