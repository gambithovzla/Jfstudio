type BirthdayWhatsAppData = {
  to: string;
  clientName: string;
  discountPercent: number;
  code: string;
  expiresLabel: string;
  template?: string;
};

const TOKEN = process.env.WHATSAPP_CLOUD_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TEMPLATE_NAME = process.env.WHATSAPP_BIRTHDAY_TEMPLATE ?? "birthday_bonus";
const TEMPLATE_LANG = process.env.WHATSAPP_BIRTHDAY_TEMPLATE_LANG ?? "es";

export function isWhatsappCloudConfigured() {
  return Boolean(TOKEN && PHONE_NUMBER_ID);
}

export function renderBirthdayMessage({
  template,
  clientName,
  discountPercent,
  code,
  expiresLabel
}: Pick<BirthdayWhatsAppData, "clientName" | "discountPercent" | "code" | "expiresLabel"> & { template: string }) {
  return template
    .replaceAll("{nombre}", clientName)
    .replaceAll("{descuento}", String(discountPercent))
    .replaceAll("{codigo}", code)
    .replaceAll("{vence}", expiresLabel);
}

export function buildWhatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function sendBirthdayMessageViaCloud(data: BirthdayWhatsAppData): Promise<boolean> {
  if (!isWhatsappCloudConfigured()) {
    return false;
  }

  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: data.to.replace(/\D/g, ""),
    type: "template",
    template: {
      name: TEMPLATE_NAME,
      language: { code: TEMPLATE_LANG },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: data.clientName },
            { type: "text", text: String(data.discountPercent) },
            { type: "text", text: data.code },
            { type: "text", text: data.expiresLabel }
          ]
        }
      ]
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[whatsapp] envio fallo:", res.status, errorText);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[whatsapp] error inesperado:", error);
    return false;
  }
}
