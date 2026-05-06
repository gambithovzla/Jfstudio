import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? "");
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "JF Studio <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type BookingEmailData = {
  to: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  timeLabel: string;
  accessToken: string;
};

type CancellationEmailData = {
  to: string;
  clientName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  note?: string;
};

type BirthdayBonusEmailData = {
  to: string;
  clientName: string;
  discountPercent: number;
  code: string;
  expiresLabel: string;
};

function bookingHtml({
  clientName,
  serviceName,
  staffName,
  dateLabel,
  timeLabel,
  accessToken
}: BookingEmailData) {
  const manageUrl = `${APP_URL}/reserva/${accessToken}`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Reserva confirmada</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;font-family:sans-serif;color:#1f2933;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" style="max-width:100%;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:800;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;">JF Studio</p>
          <h1 style="margin:0 0 20px;font-size:1.5rem;line-height:1.2;color:#1f2933;">Reserva confirmada ✅</h1>
          <p style="margin:0 0 6px;">Hola <strong>${clientName}</strong>, tu cita ha sido registrada con exito.</p>
          <table width="100%" style="margin:20px 0;background:#f5f2ed;border-radius:10px;padding:16px 20px;">
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Servicio:</strong> ${serviceName}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Estilista:</strong> ${staffName}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Fecha:</strong> ${dateLabel}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Hora:</strong> ${timeLabel}</td></tr>
          </table>
          <p style="margin:0 0 16px;font-size:0.9rem;color:#374151;">Si necesitas cancelar o reagendar, puedes hacerlo desde el siguiente enlace hasta 4 horas antes de tu cita.</p>
          <a href="${manageUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-weight:700;font-size:0.95rem;">Gestionar mi reserva</a>
          <p style="margin:24px 0 0;font-size:0.82rem;color:#9ca3af;">JF Studio · Cualquier consulta por WhatsApp.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function reminderHtml({
  clientName,
  serviceName,
  staffName,
  dateLabel,
  timeLabel,
  accessToken
}: BookingEmailData) {
  const manageUrl = `${APP_URL}/reserva/${accessToken}`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Recordatorio de cita</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;font-family:sans-serif;color:#1f2933;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" style="max-width:100%;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:800;text-transform:uppercase;color:#6b7280;">JF Studio</p>
          <h1 style="margin:0 0 20px;font-size:1.5rem;line-height:1.2;color:#1f2933;">Recordatorio: tu cita es manana 🗓️</h1>
          <p style="margin:0 0 6px;">Hola <strong>${clientName}</strong>, te recordamos que tienes una cita programada.</p>
          <table width="100%" style="margin:20px 0;background:#f5f2ed;border-radius:10px;padding:16px 20px;">
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Servicio:</strong> ${serviceName}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Estilista:</strong> ${staffName}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Fecha:</strong> ${dateLabel}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Hora:</strong> ${timeLabel}</td></tr>
          </table>
          <p style="margin:0 0 16px;font-size:0.9rem;color:#374151;">Si necesitas cancelar o reagendar, hazlo con al menos 4 horas de anticipacion.</p>
          <a href="${manageUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-weight:700;font-size:0.95rem;">Gestionar mi reserva</a>
          <p style="margin:24px 0 0;font-size:0.82rem;color:#9ca3af;">JF Studio · Cualquier consulta por WhatsApp.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function cancellationHtml({ clientName, serviceName, dateLabel, timeLabel, note }: CancellationEmailData) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Cita cancelada</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;font-family:sans-serif;color:#1f2933;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" style="max-width:100%;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:800;text-transform:uppercase;color:#6b7280;">JF Studio</p>
          <h1 style="margin:0 0 20px;font-size:1.5rem;line-height:1.2;color:#b91c1c;">Cita cancelada</h1>
          <p style="margin:0 0 6px;">Hola <strong>${clientName}</strong>, te confirmamos que tu cita fue cancelada.</p>
          <table width="100%" style="margin:20px 0;background:#f5f2ed;border-radius:10px;padding:16px 20px;">
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Servicio:</strong> ${serviceName}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Fecha:</strong> ${dateLabel}</td></tr>
            <tr><td style="padding:4px 0;font-size:0.9rem;"><strong>Hora:</strong> ${timeLabel}</td></tr>
            ${note ? `<tr><td style="padding:8px 0 0;font-size:0.9rem;border-top:1px solid #ddd6cc;margin-top:6px;"><strong>Motivo:</strong> ${note}</td></tr>` : ""}
          </table>
          <a href="${APP_URL}/reservar" style="display:inline-block;background:#c4587a;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-weight:700;font-size:0.95rem;">Hacer nueva reserva</a>
          <p style="margin:24px 0 0;font-size:0.82rem;color:#9ca3af;">JF Studio · Cualquier consulta por WhatsApp.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function lowStockHtml(products: { name: string; stock: number; unit: string; threshold: number }[]) {
  const rows = products
    .map((p) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e8e2d8;">${p.name}</td><td style="padding:6px 8px;border-bottom:1px solid #e8e2d8;color:#b91c1c;font-weight:700;">${p.stock} ${p.unit}</td><td style="padding:6px 8px;border-bottom:1px solid #e8e2d8;color:#6b7280;">${p.threshold} ${p.unit}</td></tr>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Stock bajo</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;font-family:sans-serif;color:#1f2933;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" style="max-width:100%;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:800;text-transform:uppercase;color:#c4587a;">JF Studio · Alerta de inventario</p>
          <h1 style="margin:0 0 16px;font-size:1.4rem;color:#1a1a1a;">⚠️ Stock bajo en productos</h1>
          <p style="margin:0 0 20px;color:#374151;">Los siguientes productos están por debajo del umbral de alerta:</p>
          <table width="100%" style="border-collapse:collapse;font-size:0.9rem;">
            <thead><tr style="background:#f5f2ed;">
              <th style="padding:8px;text-align:left;">Producto</th>
              <th style="padding:8px;text-align:left;">Stock actual</th>
              <th style="padding:8px;text-align:left;">Umbral</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin:20px 0 0;font-size:0.85rem;color:#6b7280;">Revisa el inventario en el panel de administración.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function safeSend(args: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0]) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY no configurada, omitiendo envio.");
    return;
  }

  try {
    const result = await getResend().emails.send(args);
    if (result.error) {
      console.error("[email] error de Resend:", result.error);
    }
  } catch (error) {
    console.error("[email] fallo inesperado:", error);
  }
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  await safeSend({
    from: FROM,
    to: data.to,
    subject: `Reserva confirmada · ${data.dateLabel} ${data.timeLabel} · JF Studio`,
    html: bookingHtml(data)
  });
}

export async function sendBookingReminder(data: BookingEmailData) {
  await safeSend({
    from: FROM,
    to: data.to,
    subject: `Recordatorio: tu cita es manana · ${data.timeLabel} · JF Studio`,
    html: reminderHtml(data)
  });
}

export async function sendBookingCancellation(data: CancellationEmailData) {
  await safeSend({
    from: FROM,
    to: data.to,
    subject: `Cita cancelada · JF Studio`,
    html: cancellationHtml(data)
  });
}

export async function sendLowStockAlert(products: { name: string; stock: number; unit: string; threshold: number }[]) {
  const to = process.env.ADMIN_EMAIL ?? FROM.replace(/^[^<]*<|>$/g, "");
  await safeSend({
    from: FROM,
    to,
    subject: `⚠️ Stock bajo en ${products.length} producto${products.length > 1 ? "s" : ""} · JF Studio`,
    html: lowStockHtml(products)
  });
}

export async function sendNewBookingNotification(data: {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  timeLabel: string;
}) {
  const to = process.env.ADMIN_EMAIL ?? FROM.replace(/^[^<]*<|>$/g, "");
  await safeSend({
    from: FROM,
    to,
    subject: `Nueva reserva: ${data.clientName} · ${data.dateLabel} ${data.timeLabel}`,
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Nueva reserva</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;font-family:sans-serif;color:#1f2933;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="480" style="max-width:100%;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:28px 32px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:0.72rem;font-weight:800;text-transform:uppercase;color:#c4587a;letter-spacing:0.08em;">JF Studio · Nueva reserva</p>
          <h1 style="margin:0 0 18px;font-size:1.3rem;color:#1a1a1a;">📅 ${data.clientName} reservó una cita</h1>
          <table width="100%" style="background:#f5f2ed;border-radius:10px;padding:14px 18px;font-size:0.9rem;">
            <tr><td style="padding:3px 0;"><strong>Servicio:</strong> ${data.serviceName}</td></tr>
            <tr><td style="padding:3px 0;"><strong>Estilista:</strong> ${data.staffName}</td></tr>
            <tr><td style="padding:3px 0;"><strong>Fecha:</strong> ${data.dateLabel}</td></tr>
            <tr><td style="padding:3px 0;"><strong>Hora:</strong> ${data.timeLabel}</td></tr>
            <tr><td style="padding:3px 0;"><strong>Telefono:</strong> ${data.clientPhone}</td></tr>
          </table>
          <p style="margin:18px 0 0;font-size:0.82rem;color:#9ca3af;">Puedes ver y gestionar esta cita desde el panel de administracion.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  });
}

function birthdayHtml({ clientName, discountPercent, code, expiresLabel }: BirthdayBonusEmailData) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Feliz cumpleanos</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;font-family:Georgia,'Playfair Display',serif;color:#1f2933;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" style="max-width:100%;background:#fff;border-radius:14px;border:1px solid #e5e7eb;padding:36px 32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:0.78rem;font-weight:800;text-transform:uppercase;color:#c4587a;letter-spacing:0.08em;font-family:Inter,Arial,sans-serif;">JF Studio</p>
          <h1 style="margin:0 0 14px;font-size:2rem;line-height:1.15;color:#1a1a1a;">Feliz cumpleanos, ${clientName} 🎉</h1>
          <p style="margin:0 0 20px;font-size:1rem;line-height:1.55;color:#374151;font-family:Inter,Arial,sans-serif;">
            Queremos celebrarte con un regalo especial: <strong>${discountPercent}% de descuento</strong> en tu proximo servicio.
          </p>
          <table width="100%" style="margin:18px 0 22px;background:linear-gradient(135deg,#f5edd6,#f9e8ee);border-radius:14px;padding:20px;text-align:center;">
            <tr><td>
              <p style="margin:0 0 6px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#a83e5e;font-family:Inter,Arial,sans-serif;">Tu codigo</p>
              <p style="margin:0;font-size:1.7rem;font-weight:800;letter-spacing:0.18em;color:#1a1a1a;font-family:'Courier New',monospace;">${code}</p>
              <p style="margin:8px 0 0;font-size:0.85rem;color:#6b7280;font-family:Inter,Arial,sans-serif;">Valido hasta el ${expiresLabel}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 18px;font-size:0.95rem;color:#374151;font-family:Inter,Arial,sans-serif;">
            Cuando reserves, indicanos tu codigo y aplicaremos el descuento al total.
          </p>
          <a href="${APP_URL}/reservar" style="display:inline-block;background:#c4587a;color:#fff;text-decoration:none;border-radius:10px;padding:14px 26px;font-weight:700;font-size:0.95rem;font-family:Inter,Arial,sans-serif;">Reservar ahora</a>
          <p style="margin:28px 0 0;font-size:0.82rem;color:#9ca3af;font-family:Inter,Arial,sans-serif;">Con carino, el equipo de JF Studio.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendBirthdayBonus(data: BirthdayBonusEmailData) {
  await safeSend({
    from: FROM,
    to: data.to,
    subject: `Feliz cumpleanos ${data.clientName} · Tu regalo de JF Studio 🎉`,
    html: birthdayHtml(data)
  });
}
