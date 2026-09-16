const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const path = require("path");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function getClient() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.",
    );
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function extensionFor(originalName, mimeType) {
  const fromName = path.extname(originalName || "").toLowerCase();
  if (fromName && fromName.length <= 6) return fromName;
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return map[mimeType] || ".jpg";
}

function publicUrlForKey(key) {
  const base = (
    process.env.AWS_S3_PUBLIC_BASE_URL ||
    `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`
  ).replace(/\/$/, "");
  return `${base}/${key}`;
}

async function uploadImageBuffer({
  buffer,
  mimeType,
  originalName,
  folder = "form_images",
}) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Only JPEG, PNG, WebP, or HEIC images are allowed");
  }

  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  const ext = extensionFor(originalName, mimeType);
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Fingerprinted keys — safe to cache for 1 year at CDN/browser
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
