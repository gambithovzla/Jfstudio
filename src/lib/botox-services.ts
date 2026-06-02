/** Prefijo en nombres de `Service` para variantes de botox (grupo en UI / reserva). */
const BOTOX_LENGTH_PREFIX = /^botox\s+org[aá]nico\s+—\s+/i;

/** Servicio único legacy ("Botox organico", etc.): no se lista; el precio es solo el de la variante. */
const BOTOX_STANDALONE = /^botox\s+org[aá]nico$/i;

export function isStandaloneBotoxOrganicName(name: string): boolean {
  return BOTOX_STANDALONE.test(name.trim());
}

export type BotoxPartitionService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
};

export function partitionBotoxServices<T extends BotoxPartitionService>(services: T[]) {
  const botoxLengthTiers: T[] = [];
  const otherServices: T[] = [];

  for (const s of services) {
    const n = s.name.trim();
    if (BOTOX_LENGTH_PREFIX.test(n)) {
      botoxLengthTiers.push(s);
      continue;
    }
    if (BOTOX_STANDALONE.test(n)) {
      continue;
    }
    otherServices.push(s);
  }

  botoxLengthTiers.sort((a, b) => a.price - b.price);

  return { botoxLengthTiers, otherServices };
}

export function isBotoxPartitioned<T extends BotoxPartitionService>(partition: {
  botoxLengthTiers: T[];
}): boolean {
  return partition.botoxLengthTiers.length > 0;
}

/** Texto tras el guión largo en el nombre del servicio (para el desplegable). */
export function botoxTierChoiceLabel(serviceName: string): string {
  const idx = serviceName.indexOf("—");
  return idx >= 0 ? serviceName.slice(idx + 1).trim() : serviceName.trim();
}
