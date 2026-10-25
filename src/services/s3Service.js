const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const crypto = require("crypto");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// WebP cannot store a side longer than 16383px.
const WEBP_MAX_EDGE = 16382;

function getClient() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function publicUrlForKey(key) {
  const base = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("R2_PUBLIC_BASE_URL is not configured");
  }
  return `${base}/${key}`;
}

async function toWebp(buffer) {
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  if ((meta.width || 0) > WEBP_MAX_EDGE || (meta.height || 0) > WEBP_MAX_EDGE) {
    image.resize({
      width: WEBP_MAX_EDGE,
      height: WEBP_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  return image.webp({ quality: 80 }).toBuffer();
}

async function uploadImageBuffer({
  buffer,
  mimeType,
  folder = "form_images",
}) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Only JPEG, PNG, WebP, or HEIC images are allowed");
  }

  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2_BUCKET is not configured");
  }

  const body = await toWebp(buffer);
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.webp`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return {
    key,
    url: publicUrlForKey(key),
  };
}

module.exports = {
  uploadImageBuffer,
  ALLOWED_MIME,
};
