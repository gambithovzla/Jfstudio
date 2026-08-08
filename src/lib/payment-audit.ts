export type PaymentAuditActionName = "CREATE" | "UPDATE" | "DELETE" | "REFUND";

export const PAYMENT_AUDIT_ACTION_LABEL: Record<PaymentAuditActionName, string> = {
  CREATE: "Cobro adicional",
  UPDATE: "Correccion",
  DELETE: "Eliminacion",
  REFUND: "Reembolso"
};

export function paymentAuditActionLabel(action: string) {
  return PAYMENT_AUDIT_ACTION_LABEL[action as PaymentAuditActionName] ?? action;
}

type AuditSide = {
  amount: unknown;
  method: string | null;
};

/// Un lado vacio significa "no existia": antes vacio = alta, despues vacio = baja.
export function describePaymentAuditSide(
  side: AuditSide,
  formatAmount: (value: number) => string
) {
  if (side.amount === null || side.amount === undefined) return "—";
  return `${formatAmount(Number(side.amount))} (${side.method ?? ""})`;
}

export function describePaymentAuditChange(
  entry: { beforeAmount: unknown; beforeMethod: string | null; afterAmount: unknown; afterMethod: string | null },
  formatAmount: (value: number) => string
) {
  const hasBefore = entry.beforeAmount !== null && entry.beforeAmount !== undefined;
  const hasAfter = entry.afterAmount !== null && entry.afterAmount !== undefined;

  const before = describePaymentAuditSide({ amount: entry.beforeAmount, method: entry.beforeMethod }, formatAmount);
  const after = describePaymentAuditSide({ amount: entry.afterAmount, method: entry.afterMethod }, formatAmount);

  if (hasBefore && hasAfter) return `${before} → ${after}`;
  if (hasBefore) return `Elimino ${before}`;
  if (hasAfter) return `Registro ${after}`;
  return "";
}
