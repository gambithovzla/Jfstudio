import { test, expect } from "@playwright/test";
import { gotoAdminPage } from "../fixtures";

test.describe("Admin — servicios", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAdminPage(page, "/admin/servicios");
  });

  test("muestra el título Menu del salon", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Menu del salon|Servicios/i })
    ).toBeVisible();
  });

  test("formulario de Nuevo servicio es visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Nuevo servicio/i })
    ).toBeVisible();
  });

  test("campo Nombre es requerido", async ({ page }) => {
    const nameInput = page.getByLabel("Nombre");
    await expect(nameInput).toBeVisible();
    expect(await nameInput.getAttribute("required")).not.toBeNull();
  });

  test("campo Duración (min) es de tipo number", async ({ page }) => {
    const durationInput = page.getByLabel("Duracion (min)");
    await expect(durationInput).toBeVisible();
    expect(await durationInput.getAttribute("type")).toBe("number");
  });

  test("campo Precio existe", async ({ page }) => {
    await expect(page.getByLabel("Precio")).toBeVisible();
  });
});
