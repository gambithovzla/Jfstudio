/**
 * Precio de una cita.
 *
 * El total se deriva SIEMPRE de los snapshots de servicio y del bono de cumpleanos
 * canjeado, nunca de lo que entra en caja: cuando la clienta deja adelanto solo se cobra
 * el saldo, y tomar ese monto como precio hace aparecer la diferencia como un descuento
 * que nunca existio. El unico descuento del sistema es el bono de cumpleanos.
 */

export type AppointmentPricing = {
  subtotal: number;
  discount: number;
  total: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export function sumServicePrices(services: { priceSnapshot: unknown }[]) {
  return round2(services.reduce((sum, service) => sum + Number(service.priceSnapshot), 0));
}

export function computeAppointmentPricing(
  subtotal: number,
  bonusDiscountPercent?: number | null
): AppointmentPricing {
  const percent =
    typeof bonusDiscountPercent === "number" && Number.isFinite(bonusDiscountPercent)
      ? Math.min(Math.max(bonusDiscountPercent, 0), 100)
      : 0;

  if (percent === 0) {
    return { subtotal, discount: 0, total: subtotal };
  }

  const total = round2(subtotal * (1 - percent / 100));
  return { subtotal, discount: round2(subtotal - total), total };
}
