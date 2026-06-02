import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

test.describe("Admin — login", () => {
  test("página de login carga correctamente", async ({ page }) => {
    await page.goto("/admin/login", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Acceso/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrar/i })).toBeVisible();
  });

  test("formulario apunta a /api/auth/login", async ({ page }) => {
    await page.goto("/admin/login", { timeout: 15_000 });
    const form = page.locator("form");
    const action = await form.getAttribute("action");
    expect(action).toBe("/api/auth/login");
  });

  test.describe("Con ADMIN_PASSWORD configurado", () => {
    test.skip(!ADMIN_PASSWORD, "PLAYWRIGHT_ADMIN_PASSWORD no está configurado");

    test("contraseña incorrecta muestra error (?error=1)", async ({ page }) => {
      await page.goto("/admin/login", { timeout: 15_000 });
      await page.locator('input[name="password"]').fill("contrasenha-incorrecta-xyz");
      await page.getByRole("button", { name: /Entrar/i }).click();
      await expect(page).toHaveURL(/error=1/);
    });

    test("contraseña correcta redirige a /admin/agenda", async ({ page }) => {
      await page.goto("/admin/login", { timeout: 15_000 });
      await page.locator('input[name="password"]').fill(ADMIN_PASSWORD!);
      await page.getByRole("button", { name: /Entrar/i }).click();
      await expect(page).toHaveURL(/\/admin\/agenda/);
    });

    test("sin sesión, /admin/agenda redirige a login", async ({ page }) => {
      await page.context().clearCookies();
      await page.goto("/admin/agenda", { timeout: 15_000 });
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  });
});
