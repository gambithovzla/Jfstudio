import { test, expect } from "@playwright/test";
import { gotoAdminPage } from "../fixtures";

test.describe("Admin — caja", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminPage(page, "/admin/caja");
  });

  test("página carga con heading principal", async ({ page }) => {
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("muestra una fecha en el header", async ({ page }) => {
    const dateText = page
      .locator(".page-header")
      .getByText(
        /\d{4}|\d{2}\/\d{2}|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i
      );
    await expect(dateText.first()).toBeVisible();
  });

  test("hay links de navegación de fecha anterior/siguiente", async ({ page }) => {
    const links = page
      .getByRole("link")
      .filter({ hasText: /←|→|anterior|siguiente/i });
    await expect(links.first()).toBeVisible();
  });

  test("navegación → modifica URL con parámetro date", async ({ page }) => {
    const links = page.getByRole("link").filter({ hasText: /→/ });
    if (await links.count() === 0) {
      test.skip(true, "No hay botón → visible");
      return;
    }
    await links.first().click();
    await expect(page).toHaveURL(/date=/);
  });

  test("cuerpo de página no muestra errores de servidor", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});
