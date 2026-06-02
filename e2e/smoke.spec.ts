import { test, expect } from "@playwright/test";

test.describe("Smoke — todas las rutas cargan sin errores", () => {
  test("landing / → carga con título correcto", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/JF Studio|Johanna Figueredo/i);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("reservar → carga sin error de servidor", async ({ page }) => {
    const response = await page.goto("/reservar");
    // Acepta tanto el formulario (con BD) como el aviso de setup (sin BD)
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(503);
    await expect(page.locator("body")).not.toContainText("Application error");
    // Verifica que hay algún heading (ya sea el del formulario o el de setup)
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible();
  });

  test("faq → muestra preguntas frecuentes", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.getByRole("heading", { name: /Preguntas/i })).toBeVisible();
  });

  test("admin/login → muestra formulario de acceso", async ({ page }) => {
    await page.goto("/admin/login", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Acceso/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("ruta inexistente → página 404 o contenido de error", async ({ page }) => {
    const response = await page.goto("/ruta-que-no-existe-xyzabc");
    // Next.js dev puede retornar 404 o renderizar la página not-found
    expect(response?.status()).toBeLessThan(500);
    // El body no debe tener error de servidor
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("sin errores de consola críticos en landing", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
