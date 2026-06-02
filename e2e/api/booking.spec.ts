import { test, expect } from "@playwright/test";

const VALID_BOOKING_PAYLOAD = {
  client: {
    name: "Test Cliente",
    phone: "987654321",
    email: "test@ejemplo.com",
  },
  serviceIds: ["svc-test-id"],
  staffId: "staff-test-id",
  startAt: "2026-06-15T14:00:00.000Z",
};

test.describe("API — POST /api/bookings", () => {
  test("sin content-type multipart retorna 400 con mensaje claro", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(VALID_BOOKING_PAYLOAD),
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
  });

  test("multipart sin campo payload retorna 400", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      multipart: {
        sinPayload: "vacío",
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("multipart con payload JSON inválido retorna 400", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      multipart: {
        payload: "esto no es json válido {{{",
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("invalid");
  });

  test("multipart con payload válido pero sin voucher retorna 400 o 503", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      multipart: {
        payload: JSON.stringify(VALID_BOOKING_PAYLOAD),
      },
    });
    // 400: falta voucher | 503: S3 no configurado
    expect([400, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("trampa antispam: _trap relleno retorna 200 sin crear cita", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      multipart: {
        payload: JSON.stringify(VALID_BOOKING_PAYLOAD),
        _trap: "bot-filler",
      },
    });
    // El honeypot devuelve 200 falso
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("ok", true);
  });

  test("payload con client.name demasiado corto retorna 400", async ({ request }) => {
    const badPayload = {
      ...VALID_BOOKING_PAYLOAD,
      client: { ...VALID_BOOKING_PAYLOAD.client, name: "X" },
    };
    const response = await request.post("/api/bookings", {
      multipart: {
        payload: JSON.stringify(badPayload),
      },
    });
    expect(response.status()).toBe(400);
  });

  test("payload con serviceIds vacío retorna 400", async ({ request }) => {
    const badPayload = { ...VALID_BOOKING_PAYLOAD, serviceIds: [] };
    const response = await request.post("/api/bookings", {
      multipart: {
        payload: JSON.stringify(badPayload),
      },
    });
    expect(response.status()).toBe(400);
  });

  test("payload con startAt inválido retorna 400", async ({ request }) => {
    const badPayload = { ...VALID_BOOKING_PAYLOAD, startAt: "no-es-fecha" };
    const response = await request.post("/api/bookings", {
      multipart: {
        payload: JSON.stringify(badPayload),
      },
    });
    expect(response.status()).toBe(400);
  });
});
