import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import { BACKUP_TABLES, backupStats, serializeBackup, type BackupFile } from "./backup";

function modelNameToKey(name: string): string {
  return name[0].toLowerCase() + name.slice(1);
}

describe("BACKUP_TABLES", () => {
  it("cubre exactamente todas las tablas del schema de Prisma", () => {
    const schemaTables = Prisma.dmmf.datamodel.models.map((m) => modelNameToKey(m.name)).sort();
    const backupTables = [...BACKUP_TABLES].sort();
    expect(backupTables).toEqual(schemaTables);
  });

  it("no tiene tablas duplicadas", () => {
    expect(new Set(BACKUP_TABLES).size).toBe(BACKUP_TABLES.length);
  });
});

describe("serializeBackup", () => {
  it("convierte Decimal a string (preserva precisión) y fechas a ISO", () => {
    const backup: BackupFile = {
      meta: { format: 1, app: "JF Studio", generatedAt: "2026-06-02T00:00:00.000Z", tableCounts: {} },
      data: {
        service: [
          {
            id: "s1",
            price: new Prisma.Decimal("123.45"),
            createdAt: new Date("2026-01-01T08:30:00.000Z")
          }
        ]
      }
    };

    const parsed = JSON.parse(serializeBackup(backup));

    expect(parsed.data.service[0].price).toBe("123.45");
    expect(parsed.data.service[0].createdAt).toBe("2026-01-01T08:30:00.000Z");
  });

  it("hace round-trip sin perder datos escalares", () => {
    const backup: BackupFile = {
      meta: { format: 1, app: "JF Studio", generatedAt: "2026-06-02T00:00:00.000Z", tableCounts: { client: 1 } },
      data: { client: [{ id: "c1", name: "Ana", phone: null, email: "ana@example.com" }] }
    };

    const parsed = JSON.parse(serializeBackup(backup)) as BackupFile;

    expect(parsed.data.client[0]).toEqual({ id: "c1", name: "Ana", phone: null, email: "ana@example.com" });
    expect(parsed.meta.tableCounts.client).toBe(1);
  });
});

describe("backupStats", () => {
  it("resume conteos clave y total", () => {
    const backup: BackupFile = {
      meta: {
        format: 1,
        app: "JF Studio",
        generatedAt: "2026-06-02T00:00:00.000Z",
        tableCounts: { client: 3, appointment: 5, payment: 4, service: 2 }
      },
      data: {}
    };

    expect(backupStats(backup)).toEqual({ clients: 3, appointments: 5, payments: 4, totalRecords: 14 });
  });
});
