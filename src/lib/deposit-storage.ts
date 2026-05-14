import { randomUUID } from "node:crypto";
import path from "node:path";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let s3: S3Client | null = null;

function getClient(): S3Client {
  if (s3) return s3;
  const endpoint = process.env.DEPOSIT_S3_ENDPOINT?.trim();
  s3 = new S3Client({
    region: process.env.DEPOSIT_S3_REGION || "auto",
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.DEPOSIT_S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.DEPOSIT_S3_SECRET_ACCESS_KEY ?? ""
    }
  });
  return s3;
}

export function isDepositStorageConfigured(): boolean {
  return Boolean(
    process.env.DEPOSIT_S3_BUCKET?.trim() &&
      process.env.DEPOSIT_S3_ACCESS_KEY_ID?.trim() &&
      process.env.DEPOSIT_S3_SECRET_ACCESS_KEY?.trim()
  );
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export function assertAllowedVoucherMime(mime: string) {
  const m = mime.toLowerCase().split(";")[0].trim();
  if (!ALLOWED_MIME.has(m)) {
    throw new Error("Formato de comprobante no permitido. Usa JPG, PNG, WebP o PDF.");
  }
}

export async function uploadDepositVoucher(params: {
  buffer: Buffer;
  mime: string;
  originalFilename: string;
}): Promise<{ key: string }> {
  return uploadPrivateSalonFile({ ...params, prefix: "vouchers" });
}

/** Adjunto de cuidados post-visita (mismas reglas MIME que comprobantes). */
export async function uploadPostVisitCareFile(params: {
  buffer: Buffer;
  mime: string;
  originalFilename: string;
}): Promise<{ key: string }> {
  return uploadPrivateSalonFile({ ...params, prefix: "post-visit" });
}

async function uploadPrivateSalonFile(params: {
  buffer: Buffer;
  mime: string;
  originalFilename: string;
  prefix: "vouchers" | "post-visit";
}): Promise<{ key: string }> {
  if (!isDepositStorageConfigured()) {
    throw new Error(
      "Almacenamiento de comprobantes no configurado. Define DEPOSIT_S3_BUCKET y credenciales S3 (o R2)."
    );
  }
  assertAllowedVoucherMime(params.mime);
  const bucket = process.env.DEPOSIT_S3_BUCKET!.trim();
  const ext = path.extname(params.originalFilename).slice(0, 10) || ".bin";
  const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : ".bin";
  const key = `${params.prefix}/${new Date().getUTCFullYear()}/${randomUUID()}${safeExt}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.mime.split(";")[0].trim(),
      ServerSideEncryption: "AES256"
    })
  );

  return { key };
}

export async function getDepositVoucherBuffer(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (!isDepositStorageConfigured()) {
    throw new Error("Almacenamiento de comprobantes no configurado.");
  }
  const bucket = process.env.DEPOSIT_S3_BUCKET!.trim();
  const out = await getClient().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
  const body = out.Body;
  if (!body) {
    throw new Error("Archivo no encontrado.");
  }
  const buffer = Buffer.from(await body.transformToByteArray());
  const contentType = out.ContentType || "application/octet-stream";
  return { buffer, contentType };
}
