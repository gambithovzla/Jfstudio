import { test, expect } from "@playwright/test";
import { gotoAdminPage } from "../fixtures";

test.describe("Admin — agenda", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminPage(page, "/admin/agenda");
  });

  test("muestra cabecera con título Agenda", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible();
  });

  test("botón Nueva cita es visible", async ({ page }) => {
    const newApptLink = page
      .getByRole("link", { name: /Nueva cita|Nuevo|Crear/i })
      .first();
    await expect(newApptLink).toBeVisible();
  });

  test("hay links de navegación de fecha", async ({ page }) => {
    const navLinks = page
      .getByRole("link")
      .filter({ hasText: /←|→|Anterior|Siguiente|Hoy/i });
    await expect(navLinks.first()).toBeVisible();
  });

  test("sidebar de admin es visible", async ({ page }) => {
    const nav = page.locator("nav, aside, .sidebar").first();
    await expect(nav).toBeVisible();
  });

  test("modo Lista del calendario se muestra en movil", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAdminPage(page, "/admin/agenda?view=calendar");

    await page.getByRole("button", { name: "Lista" }).click();

    const agendaContent = page.locator(".rbc-agenda-view, .rbc-agenda-empty").first();
    await expect(agendaContent).toBeVisible();
    await expect
      .poll(async () => agendaContent.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThan(20);
  });
});
