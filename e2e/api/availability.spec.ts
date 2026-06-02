import { test, expect } from "@playwright/test";

test.describe("API — GET /api/availability", () => {
  test("sin parámetros retorna { slots: [] } con status 200", async ({ request }) => {
    const response = await request.get("/api/availability");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("slots");
    expect(Array.isArray(body.slots)).toBe(true);
    expect(body.slots).toHaveLength(0);
  });

  test("con solo date retorna { slots: [] } con status 200", async ({ request }) => {
    const response = await request.get("/api/availability?date=2026-06-15");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.slots).toHaveLength(0);
  });

  test("con date y serviceIds inválidos retorna 200 o 400 (no 500)", async ({ request }) => {
    const response = await request.get(
      "/api/availability?date=fecha-invalida&serviceIds=id-fake-123"
    );
    expect([200, 400]).toContain(response.status());
  });

  test("con parámetros válidos retorna estructura { slots: [...] }", async ({ request }) => {
    // Usamos una fecha futura y un ID de servicio fake — puede retornar slots vacíos
    // pero la estructura de respuesta debe ser correcta
    const response = await request.get(
      "/api/availability?date=2026-06-15&serviceIds=svc-fake-id&staffId=any"
    );
    const status = response.status();
    expect([200, 400]).toContain(status);

    if (status === 200) {
      const body = await response.json();
      expect(body).toHaveProperty("slots");
      expect(Array.isArray(body.slots)).toBe(true);
    }
  });

  test("content-type de la respuesta es JSON", async ({ request }) => {
    const response = await request.get("/api/availability");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });
});
