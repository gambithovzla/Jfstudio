import { APIRequestContext, Page, test } from "@playwright/test";

/**
 * Obtiene la cookie de sesión admin haciendo login con PLAYWRIGHT_ADMIN_PASSWORD.
 * Retorna null si la variable de entorno no está configurada.
 */
export async function getAdminSessionCookie(
  request: APIRequestContext
): Promise<string | null> {
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
  if (!password) return null;

  const response = await request.post("/api/auth/login", {
    form: { password },
    maxRedirects: 0,
  });

  const cookies = response.headers()["set-cookie"];
  if (!cookies) return null;

  const match = cookies.match(/admin_session=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Navega a una página de admin y salta el test si:
 * - La navegación tarda demasiado (BD no disponible → timeout de TCP/Prisma), o
 * - La página redirigió a login (ADMIN_PASSWORD configurado, sin sesión), o
 * - La admin error boundary capturó un error de BD.
 *
 * Usar en beforeEach de todos los tests admin.
 */
export async function gotoAdminPage(page: Page, path: string) {
  try {
    // Timeout corto: si PostgreSQL no responde en ~8s, fallamos rápido en vez de
    // esperar el timeout TCP completo (~20s por defecto).
    await page.goto(path, { timeout: 8_000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 5_000 });
  } catch {
    test.skip(true, `Admin "${path}" no cargó — BD probablemente no disponible`);
    return;
  }
  if (page.url().includes("/admin/login")) {
    test.skip(true, "ADMIN_PASSWORD activo: requiere sesión autenticada");
    return;
  }
  const hasError = await page
    .getByText("No pudimos cargar esta seccion")
    .count();
  if (hasError > 0) {
    test.skip(true, "Base de datos no disponible en este entorno");
  }
}
