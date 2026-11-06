import { randomBytes } from "crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

type R2Config = {
  client: S3Client;
  bucket: string;
};

let cached: R2Config | null | undefined;

function loadConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    bucket,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      requestTimeout: 15_000,
    }),
  };
}

function getConfig(): R2Config | null {
  if (cached === undefined) cached = loadConfig();
  return cached;
}

export function r2Enabled(): boolean {
  return getConfig() !== null;
}

export function makeSlipKey(reference: string): string {
  const stamp = Date.now().toString(36);
  const rand = randomBytes(5).toString("hex");
  return `slips/${reference}/${stamp}-${rand}.jpg`;
}

export async function putSlipObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new Error("R2 is not configured");
  await cfg.client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, max-age=0",
    }),
  );
}

export async function getSlipObject(
  key: string,
): Promise<{ data: Uint8Array; contentType: string } | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  try {
    const res = await cfg.client.send(
      new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
    );
    if (!res.Body) return null;
    const data = await res.Body.transformToByteArray();
    return { data, contentType: res.ContentType ?? "image/jpeg" };
  } catch {
    return null;
  }
}

export async function deleteSlipObject(key: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;
  try {
    await cfg.client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
  } catch {
    // best-effort cleanup — orphaned objects are harmless
  }
}
