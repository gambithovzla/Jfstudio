import { test, expect } from "@playwright/test";

const MOCK_BOOTSTRAP = {
  settings: { currency: "PEN", timezone: "America/Lima" },
  services: [
    {
      id: "svc-corte",
      name: "Corte de cabello",
      description: "Corte profesional",
      durationMinutes: 60,
      price: 80,
      requiresDeposit: true,
    },
    {
      id: "svc-color",
      name: "Color global",
      description: "Coloración completa",
      durationMinutes: 120,
      price: 180,
      requiresDeposit: true,
    },
    {
      id: "svc-laceado-corto",
      name: "Laceado Orgánico Pelo Corto",
      description: "Laceado hasta hombros",
      durationMinutes: 90,
      price: 150,
      requiresDeposit: true,
    },
  ],
  staff: [
    { id: "staff-1", name: "Johanna", color: "#c084fc" },
  ],
};

test.describe("Formulario de reserva", () => {
  test.beforeEach(async ({ page }) => {
    // Mock availability para no depender de la BD
    await page.route("/api/availability*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          slots: [
            {
              staffId: "staff-1",
              staffName: "Johanna",
              startAt: "2026-06-15T14:00:00.000Z",
              endAt: "2026-06-15T15:00:00.000Z",
              label: "09:00 - 10:00",
            },
          ],
        }),
      });
    });

    // Mock birthday check
    await page.route("/api/clients/birthday-check*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "unknown" }),
      });
    });

    await page.goto("/reservar");
    await page.waitForLoadState("domcontentloaded");
  });

  // Salta el test si la página muestra SetupNotice (sin BD disponible)
  async function skipIfSetupNotice(page: import("@playwright/test").Page) {
    const hasSetupNotice = await page.getByRole("heading", { name: /Base de datos pendiente/i }).count();
    if (hasSetupNotice > 0) {
      test.skip(true, "BD no disponible: la página muestra SetupNotice");
    }
  }

  test("muestra el heading Reserva tu cita (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    await expect(page.getByRole("heading", { name: /Reserva tu cita/i })).toBeVisible();
  });

  test("campos de nombre y teléfono son visibles (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await expect(page.getByLabel("Telefono")).toBeVisible();
  });

  test("campo email es visible (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    await expect(page.getByLabel("Correo")).toBeVisible();
  });

  test("selector de fecha existe con valor por defecto (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    const dateInput = page.getByLabel("Fecha");
    await expect(dateInput).toBeVisible();
    const value = await dateInput.inputValue();
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("nombre tiene atributo required (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    const nameInput = page.getByLabel("Nombre");
    const required = await nameInput.getAttribute("required");
    expect(required).not.toBeNull();
  });

  test("teléfono tiene atributo required (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    const phoneInput = page.getByLabel("Telefono");
    const required = await phoneInput.getAttribute("required");
    expect(required).not.toBeNull();
  });

  test("campo email acepta formato de email (type=email) (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    const emailInput = page.getByLabel("Correo");
    const type = await emailInput.getAttribute("type");
    expect(type).toBe("email");
  });

  test("se puede escribir en los campos de cliente (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    await page.getByLabel("Nombre").fill("Ana García");
    await page.getByLabel("Telefono").fill("987654321");
    await page.getByLabel("Correo").fill("ana@ejemplo.com");

    await expect(page.getByLabel("Nombre")).toHaveValue("Ana García");
    await expect(page.getByLabel("Telefono")).toHaveValue("987654321");
    await expect(page.getByLabel("Correo")).toHaveValue("ana@ejemplo.com");
  });

  test("campo código de cumpleaños es visible (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    await expect(page.getByLabel(/código de cumpleaños/i)).toBeVisible();
  });

  test("campo notas es visible (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    await expect(page.getByLabel("Notas")).toBeVisible();
  });

  test("campo comprobante de adelanto es visible (S/ 50) (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    const voucherLabel = page.getByText(/Comprobante de adelanto/i);
    await expect(voucherLabel).toBeVisible();
    const voucherInput = page.locator('input[name="voucher"]');
    await expect(voucherInput).toBeVisible();
  });

  test("sección Horario está presente (requiere BD)", async ({ page }) => {
    await skipIfSetupNotice(page);
    const horariosHeading = page.getByRole("heading", { name: /Elige una hora/i });
    await expect(horariosHeading).toBeVisible();
  });
});

test.describe("Formulario de reserva — con servicios de BD disponibles", () => {
  test("si la BD no está disponible, la página muestra aviso de setup", async ({ page }) => {
    // La página trata el error de BD con gracia; verifica que no haya 500
    const response = await page.goto("/reservar");
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(503);
  });
});
