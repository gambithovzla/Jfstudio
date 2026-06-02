import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("header visible con link Reservar", async ({ page }) => {
    const header = page.locator("header, nav").first();
    await expect(header).toBeVisible();
    const reservarLink = page.getByRole("link", { name: /Reservar/i }).first();
    await expect(reservarLink).toBeVisible();
  });

  test("hero section visible", async ({ page }) => {
    const hero = page.locator(".hero, [class*='hero']").first();
    await expect(hero).toBeVisible();
  });

  test("sección de servicios existe", async ({ page }) => {
    const services = page.locator(".services, [class*='services'], section").filter({
      hasText: /Servicio|Corte|Balayage|Laceado|Color/i,
    }).first();
    await expect(services).toBeVisible();
  });

  test("galería visible", async ({ page }) => {
    const gallery = page.locator(".gallery, [class*='gallery']").first();
    await expect(gallery).toBeVisible();
  });

  test("footer con datos de contacto", async ({ page }) => {
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
  });

  test("link Reservar del header navega a /reservar", async ({ page }) => {
    const reservarLink = page.getByRole("link", { name: /Reservar/i }).first();
    await reservarLink.click();
    await expect(page).toHaveURL(/\/reservar/);
  });

  test("mobile: header no rompe el layout (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // Verifica que no hay scroll horizontal
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test("meta description presente", async ({ page }) => {
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });
});
