import { test, expect } from "@playwright/test";
import { gotoAdminPage } from "../fixtures";

test.describe("Admin — clientes", () => {
  test.describe("Lista de clientes", () => {
    test.beforeEach(async ({ page }) => {
      await gotoAdminPage(page, "/admin/clientes");
    });

    test("muestra título Historial de clientas", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /Historial de clientas|Clientes/i })
      ).toBeVisible();
    });

    test("botón Nueva clienta es visible", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /Nueva clienta/i })
      ).toBeVisible();
    });

    test("campo de búsqueda y botón Buscar existen", async ({ page }) => {
      await expect(page.locator('input[type="search"]')).toBeVisible();
      await expect(page.getByRole("button", { name: /Buscar/i })).toBeVisible();
    });

    test("búsqueda actualiza la URL con parámetro q", async ({ page }) => {
      await page.locator('input[name="q"]').fill("Maria");
      await page.getByRole("button", { name: /Buscar/i }).click();
      await expect(page).toHaveURL(/q=Maria/i);
    });
  });

  test.describe("Formulario Nueva clienta", () => {
    // /admin/clientes/nuevo es estático, pero AdminShell en el layout necesita BD
    test.beforeEach(async ({ page }) => {
      await gotoAdminPage(page, "/admin/clientes/nuevo");
    });

    test("muestra el heading Nueva clienta", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /Nueva clienta/i })
      ).toBeVisible();
    });

    test("campo Nombre es visible y requerido", async ({ page }) => {
      const nameInput = page.getByLabel("Nombre");
      await expect(nameInput).toBeVisible();
      expect(await nameInput.getAttribute("required")).not.toBeNull();
    });

    test("campos Teléfono y Correo existen", async ({ page }) => {
      await expect(page.getByLabel("Telefono")).toBeVisible();
      await expect(page.getByLabel("Correo")).toBeVisible();
    });

    test("selector tipo de documento tiene opciones DNI y Pasaporte", async ({ page }) => {
      const docTypeSelect = page.getByLabel("Tipo de documento");
      await expect(docTypeSelect).toBeVisible();
      const options = await docTypeSelect.locator("option").allTextContents();
      expect(options).toContain("DNI");
      expect(options).toContain("Pasaporte");
    });

    test("campo Cumpleaños es de tipo date", async ({ page }) => {
      const birthdayInput = page.getByLabel("Cumpleaños");
      expect(await birthdayInput.getAttribute("type")).toBe("date");
    });

    test("botón Cancelar regresa a /admin/clientes", async ({ page }) => {
      const cancelBtn = page.getByRole("link", { name: /Cancelar/i });
      await expect(cancelBtn).toBeVisible();
      await cancelBtn.click();
      await expect(page).toHaveURL(/\/admin\/clientes$/);
    });

    test("se puede escribir en los campos", async ({ page }) => {
      await page.getByLabel("Nombre").fill("Test Cliente");
      await page.getByLabel("Telefono").fill("987000111");
      await expect(page.getByLabel("Nombre")).toHaveValue("Test Cliente");
    });
  });
});
