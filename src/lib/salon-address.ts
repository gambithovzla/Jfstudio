/** Dirección física del local (correos, políticas, landing). */
export const SALON_STREET_ADDRESS = "Av. José Larco 345, Miraflores, Lima";
export const SALON_FLOOR_OFFICE = "Piso 06 · Oficina 606";

export function salonAddressPlain(): string {
  return `${SALON_STREET_ADDRESS} — ${SALON_FLOOR_OFFICE}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bloque HTML para correos (2 líneas). */
export function salonAddressEmailHtml(): string {
  return `<strong>Dirección:</strong> ${escapeHtml(SALON_STREET_ADDRESS)}<br/><strong>${escapeHtml(SALON_FLOOR_OFFICE)}</strong>`;
}
