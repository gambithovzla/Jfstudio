/**
 * Orden de tablas por dependencias (las "padre" antes que las "hijas"). Este mismo orden
 * se usa al restaurar para no violar las llaves foráneas.
 *
 * Módulo puro a propósito: no importa Prisma ni el cliente, para poder usarlo desde
 * scripts (db:restore) sin instanciar la conexión antes de resolver la URL de la base.
 */
export const BACKUP_TABLES = [
  "salonSettings",
  "birthdayBonusSettings",
  "paymentMethodConfig",
  "clientTestimonial",
  "landingGalleryImage",
  "staff",
  "workingHour",
  "client",
  "service",
  "product",
  "serviceProduct",
  "birthdayBonus",
  "appointment",
  "appointmentService",
  "payment",
  "inventoryMovement",
  "timeBlock"
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];
