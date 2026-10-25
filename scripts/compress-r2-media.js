/**
 * Shrink images and videos already on R2, then bust the cache with ?v=2.
 *
 *   node scripts/compress-r2-media.js
 *
 * Images: max 1600px (logo 400px), WebP quality 78.
 * Videos: 720p, no audio. Small banner clips: 360p.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const ROOT = path.resolve(__dirname, "..", "..");
const HOST = "https://media.b-spoke.com.au";
const CACHE_BUST = "v=2";
const TMP = path.join(__dirname, ".migrate-cache");
const MAP_PATH = path.join(__dirname, "r2-compress-map.json");

const SCAN_DIRS = [
  path.join(ROOT, "frontend", "src"),
  path.join(ROOT, "backend", "src"),
];
const EXTRA_FILES = [path.join(ROOT, "frontend", "index.html")];
const TEXT_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".html", ".css"]);

const SMALL_VIDEOS = new Set([
  "banner_video/3d-rendering-laundry-room-on-ground-floor-washing-2025-12-17-11-02-47-utc.mp4",
  "banner_video/beautiful-modern-bathroom-bathtub-washbasin-sa-2026-01-28-02-42-23-utc_(1).mp4",
]);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
}

function sourceFiles() {
  const files = [];
  SCAN_DIRS.forEach((dir) => walk(dir, files));
  EXTRA_FILES.forEach((file) => {
    if (fs.existsSync(file)) files.push(file);
  });
  return files;
}

function collectUrls(files) {
  const re = /https:\/\/media\.b-spoke\.com\.au\/[^\s"'`<>]+/g;
  const urls = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const matches = text.match(re) || [];
    for (const raw of matches) {
      const url = raw.replace(/[),.;]+$/, "").split("?")[0];
      urls.add(url);
    }
  }
  return [...urls];
}

function keyFromUrl(url) {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
}

function kindOf(key) {
  if (/\.(mp4|mov|webm|m4v)$/i.test(key)) return "video";
  if (/\.(webp|jpe?g|png|gif|avif)$/i.test(key)) return "image";
  return "";
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
      if (err.length > 8000) err = err.slice(-8000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim().split(/\r?\n/).slice(-8).join("\n") || `${cmd} ${code}`));
    });
  });
}

async function download(url, dest) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`download ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(dest));
  return fs.statSync(dest).size;
}

async function compressImage(input, key) {
  const isLogo = /(^|\/)logo\.webp$/i.test(key);
  const maxWidth = isLogo ? 400 : 1600;
  const maxHeight = isLogo ? 400 : 1600;
  const source = sharp(input, { failOn: "none" }).rotate();
  const meta = await source.metadata();
  const tooBig =
    (meta.width || 0) > maxWidth || (meta.height || 0) > maxHeight;
  const pipeline = tooBig
    ? source.resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
    : source;
  return pipeline.webp({ quality: 78 }).toBuffer();
}

async function compressVideo(input, output, key) {
  const small = SMALL_VIDEOS.has(key);
  const height = small ? "360" : "720";
  const crf = small ? "30" : "28";
  await run("ffmpeg", [
    "-y",
    "-i",
    input,
    "-vf",
    `scale=-2:'trunc(min(${height},ih)/2)*2'`,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    crf,
    "-pix_fmt",
    "yuv420p",
    "-an",
    "-movflags",
    "+faststart",
    output,
  ]);
}

function loadMap() {
  if (!fs.existsSync(MAP_PATH)) return {};
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
}

function saveMap(map) {
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
}

function bustUrls(files, done) {
  let links = 0;
  for (const file of files) {
    let text = fs.readFileSync(file, "utf8");
    const original = text;
    for (const url of done) {
      if (!text.includes(url)) continue;
      const next = `${url}?${CACHE_BUST}`;
      text = text.split(url).join(next).split(`${next}?${CACHE_BUST}`).join(next);
      links += 1;
    }
    if (text !== original) fs.writeFileSync(file, text);
  }
  return links;
}

async function main() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !bucket || !process.env.R2_ACCESS_KEY_ID) {
    throw new Error("R2 env vars are missing");
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  fs.mkdirSync(TMP, { recursive: true });
  const files = sourceFiles();
  const urls = collectUrls(files).filter((url) => kindOf(keyFromUrl(url)));
  const map = loadMap();
  console.log(`Media files: ${urls.length}`);

  const replaced = [];
  let index = 0;
  for (const url of urls) {
    index += 1;
    const key = keyFromUrl(url);
    const kind = kindOf(key);
    const label = `[${index}/${urls.length}]`;
    if (map[url]?.uploaded) {
      replaced.push(url);
      console.log(`${label} skip ${key}`);
      continue;
    }

    const ext = path.extname(key) || (kind === "video" ? ".mp4" : ".webp");
    const sourcePath = path.join(TMP, `in-${index}${ext}`);
    const videoOut = path.join(TMP, `out-${index}.mp4`);
    try {
      const before = await download(url, sourcePath);
      let body;
      let contentType;
      if (kind === "image") {
        const input = fs.readFileSync(sourcePath);
        body = await compressImage(input, key);
        contentType = "image/webp";
        if (body.length >= before * 0.92) {
          map[url] = { uploaded: false, skipped: true, before, after: body.length };
          saveMap(map);
          console.log(`${label} keep ${key} (${before} -> ${body.length})`);
          continue;
        }
      } else {
        await compressVideo(sourcePath, videoOut, key);
        body = fs.readFileSync(videoOut);
        contentType = "video/mp4";
        if (body.length >= before * 0.92) {
          map[url] = { uploaded: false, skipped: true, before, after: body.length };
          saveMap(map);
          console.log(`${label} keep ${key} (${before} -> ${body.length})`);
          continue;
        }
      }

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000",
        }),
      );
      map[url] = { uploaded: true, before, after: body.length, key };
      saveMap(map);
      replaced.push(url);
      console.log(`${label} ${key} ${before} -> ${body.length}`);
    } catch (error) {
      console.error(`${label} FAILED ${key}\n${error.message}`);
    } finally {
      for (const file of [sourcePath, videoOut]) {
        try {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        } catch {
          // Windows can keep a just-closed file locked for a moment.
        }
      }
    }
  }

  const links = bustUrls(sourceFiles(), replaced);
  console.log(`Updated ${links} source link(s) with ?${CACHE_BUST}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
