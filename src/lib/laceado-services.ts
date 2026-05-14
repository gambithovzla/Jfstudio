/** Prefijo en nombres de `Service` para variantes de laceado (grupo en UI / reserva). */
const LACEADO_LENGTH_PREFIX = /^laceado\s+org[aá]nico\s+—\s+/i;
const LACEADO_ABUNDANCIA = /^laceado\s+org[aá]nico\s+—\s+suplemento\s+abundancia/i;

/** Servicio único legacy ("Laceado organico", "Laceado Organico", etc.): no se lista; el precio es solo el de la variante. */
const LACEADO_STANDALONE = /^laceado\s+org[aá]nico$/i;

export function isStandaloneLaceadoOrganicName(name: string): boolean {
  return LACEADO_STANDALONE.test(name.trim());
}

export type LaceadoPartitionService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
};

export function partitionLaceadoServices<T extends LaceadoPartitionService>(services: T[]) {
  const laceadoLengthTiers: T[] = [];
  let laceadoAbundancia: T | null = null;
  const otherServices: T[] = [];

  for (const s of services) {
    const n = s.name.trim();
    if (LACEADO_ABUNDANCIA.test(n)) {
      laceadoAbundancia = s;
      continue;
    }
    if (LACEADO_LENGTH_PREFIX.test(n)) {
      laceadoLengthTiers.push(s);
      continue;
    }
    if (LACEADO_STANDALONE.test(n)) {
      continue;
    }
    otherServices.push(s);
  }

  laceadoLengthTiers.sort((a, b) => a.price - b.price);

  return { laceadoLengthTiers, laceadoAbundancia, otherServices };
}

export function isLaceadoPartitioned<T extends LaceadoPartitionService>(partition: {
  laceadoLengthTiers: T[];
}): boolean {
  return partition.laceadoLengthTiers.length > 0;
}

/** Texto tras el guión largo en el nombre del servicio (para el desplegable). */
export function laceadoTierChoiceLabel(serviceName: string): string {
  const idx = serviceName.indexOf("—");
  return idx >= 0 ? serviceName.slice(idx + 1).trim() : serviceName.trim();
}
