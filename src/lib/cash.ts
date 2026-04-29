export type PaymentSummaryInput = {
  amount: number;
  method: string;
};

export function summarizePayments(payments: PaymentSummaryInput[]) {
  const byMethod = new Map<string, number>();
  let total = 0;

  for (const payment of payments) {
    total += payment.amount;
    byMethod.set(payment.method, (byMethod.get(payment.method) ?? 0) + payment.amount);
  }

  return {
    total,
    byMethod: Array.from(byMethod.entries())
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => a.method.localeCompare(b.method))
  };
}
