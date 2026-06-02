import { test, expect } from "@playwright/test";

test.describe("FAQ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/faq");
    await page.waitForLoadState("domcontentloaded");
  });

  test("muestra el heading principal", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Preguntas/i })).toBeVisible();
  });

  test("hay al menos 5 preguntas (details)", async ({ page }) => {
    const items = page.locator("details.faq-item");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("al hacer clic en una pregunta se abre y muestra la respuesta", async ({ page }) => {
    const firstItem = page.locator("details.faq-item").first();
    const summary = firstItem.locator("summary");
    await summary.click();
    const answer = firstItem.locator(".faq-answer");
    await expect(answer).toBeVisible();
  });

  test("al hacer clic en otra pregunta también se abre", async ({ page }) => {
    const items = page.locator("details.faq-item");
    const secondItem = items.nth(1);
    await secondItem.locator("summary").click();
    await expect(secondItem.locator(".faq-answer")).toBeVisible();
  });

  test("link Reservar cita navega a /reservar", async ({ page }) => {
    const reservarLink = page.getByRole("link", { name: /Reservar cita/i });
    await expect(reservarLink).toBeVisible();
    await reservarLink.click();
    await expect(page).toHaveURL(/\/reservar/);
  });

  test("link WhatsApp tiene href a wa.me", async ({ page }) => {
    const waLink = page.getByRole("link", { name: /WhatsApp/i });
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute("href");
    expect(href).toMatch(/wa\.me/);
  });

  test("breadcrumb muestra Inicio y FAQ", async ({ page }) => {
    const breadcrumb = page.locator(".static-breadcrumb");
    await expect(breadcrumb).toContainText("Inicio");
    await expect(breadcrumb).toContainText("Preguntas frecuentes");
  });

  test("link volver al inicio navega a /", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /Volver al inicio/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL("/");
  });
});
