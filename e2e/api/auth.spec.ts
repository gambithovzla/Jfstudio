import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

test.describe("API — POST /api/auth/login", () => {
  test("sin password redirige a /admin/login?error=1", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      form: {},
      maxRedirects: 0,
    });
    // Next.js redirect puede ser 302 o 307
    expect([302, 303, 307, 308]).toContain(response.status());
    const location = response.headers()["location"];
    expect(location).toMatch(/\/admin\/login/);
    expect(location).toMatch(/error=1/);
  });

  test("con password incorrecta redirige a /admin/login?error=1", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      form: { password: "contrasenha-incorrecta-xyz-9999" },
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308]).toContain(response.status());
    const location = response.headers()["location"];
    expect(location).toMatch(/\/admin\/login/);
    expect(location).toMatch(/error=1/);
  });

  test.describe("Con ADMIN_PASSWORD configurado", () => {
    test.skip(!ADMIN_PASSWORD, "PLAYWRIGHT_ADMIN_PASSWORD no está configurado");

    test("contraseña correcta redirige a /admin/agenda y setea cookie", async ({ request }) => {
      const response = await request.post("/api/auth/login", {
        form: { password: ADMIN_PASSWORD! },
        maxRedirects: 0,
      });
      expect([302, 303, 307, 308]).toContain(response.status());
      const location = response.headers()["location"];
      expect(location).toMatch(/\/admin\/agenda/);
      const cookies = response.headers()["set-cookie"];
      expect(cookies).toMatch(/admin_session=/);
    });
  });

  test("la ruta solo acepta POST (GET devuelve 405 o redirige)", async ({ request }) => {
    const response = await request.get("/api/auth/login");
    // Next.js puede retornar 405 o 404 para métodos no permitidos en App Router
    expect([404, 405]).toContain(response.status());
  });
});
