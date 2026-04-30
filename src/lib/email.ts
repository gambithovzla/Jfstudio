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

function cancellationHtml({ clientName, serviceName, dateLabel, timeLabel }: CancellationEmailData) {
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
          </table>
          <a href="${APP_URL}/reservar" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;padding:12px 24px;font-weight:700;font-size:0.95rem;">Hacer nueva reserva</a>
          <p style="margin:24px 0 0;font-size:0.82rem;color:#9ca3af;">JF Studio · Cualquier consulta por WhatsApp.</p>
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
