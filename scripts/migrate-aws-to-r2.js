/**
 * Copy every CloudFront image and video used by the site onto Cloudflare R2,
 * then rewrite those links.
 *
 * Images become WebP. Videos become MP4 (H.264 + AAC) so <video> tags still play.
 * WebP is a picture format, so a banner video cannot be converted to WebP.
 *
 * Dry run (no downloads, no edits):
 *   node scripts/migrate-aws-to-r2.js
 *
 * Do the copy and replace the links:
 *   node scripts/migrate-aws-to-r2.js --apply
 *
 * Safe to stop and run again. Finished files are skipped via r2-migration-map.json.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const APPLY = process.argv.includes("--apply");
const ROOT = path.resolve(__dirname, "..", "..");
const AWS_BASE = (
  process.env.AWS_S3_PUBLIC_BASE_URL ||
  "https://dc3v08iv2c2ou.cloudfront.net"
).replace(/\/$/, "");
const R2_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const MAP_PATH = path.join(__dirname, "r2-migration-map.json");
const CACHE_DIR = path.join(__dirname, ".migrate-cache");

const SCAN_DIRS = [
  path.join(ROOT, "frontend", "src"),
  path.join(ROOT, "backend", "src"),
];
const EXTRA_FILES = [path.join(ROOT, "frontend", "index.html")];
const TEXT_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json"]);

const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heic",
  "heif",
  "bmp",
  "tif",
  "tiff",
]);
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "m4v", "avi", "mkv"]);

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

function extensionOf(url) {
  const clean = url.split("?")[0].split("#")[0];
  const match = clean.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

function collectUrls(files) {
  const escaped = AWS_BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}/[^\\s"'\\\`<>]+`, "g");
  const found = new Map();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const matches = text.match(re) || [];
    for (const raw of matches) {
      const url = raw.replace(/[.,;]+$/, "");
      const ext = extensionOf(url);
      if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
      if (!found.has(url)) found.set(url, []);
      found.get(url).push(path.relative(ROOT, file));
    }
  }
  return found;
}

function kindFor(ext) {
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  return "";
}

function objectPath(url) {
  const pathname = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  return pathname;
}

function nextKey(oldPath, kind) {
  const parts = oldPath.split("/");
  let file = parts.pop();
  file = file.replace(/\.[^.]+$/, "");
  if (kind === "video") file = file.replace(/\.mp4$/i, "");
  const ext = kind === "image" ? "webp" : "mp4";
  parts.push(`${file}.${ext}`);
  return parts.join("/");
}

function publicUrl(key) {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${R2_BASE}/${encoded}`;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
      if (err.length > 12000) err = err.slice(-12000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else {
        const tail = err.trim().split(/\r?\n/).slice(-12).join("\n");
        reject(new Error(tail || `${cmd} exited ${code}`));
      }
    });
  });
}

async function download(url, dest) {
  const candidates = [url];
  if (url.includes("+")) candidates.push(url.replaceAll("+", "%20"));
  let lastStatus = 0;
  for (const candidate of candidates) {
    const response = await fetch(candidate);
    if (!response.ok || !response.body) {
      lastStatus = response.status;
      continue;
    }
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(dest));
    return fs.statSync(dest).size;
  }
  throw new Error(`download failed (${lastStatus || "no response"})`);
}

async function convertImage(input, output) {
  // WebP rejects either side above 16383px. Smaller pictures are left unchanged.
  await run("ffmpeg", [
    "-y",
    "-i",
    input,
    "-vf",
    "scale=16382:16382:force_original_aspect_ratio=decrease",
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "80",
    output,
  ]);
}

async function convertVideo(input, output) {
  const videoArgs = [
    "-y",
    "-i",
    input,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
  ];
  try {
    await run("ffmpeg", [...videoArgs, "-c:a", "aac", "-b:a", "128k", output]);
  } catch (error) {
    await run("ffmpeg", [...videoArgs, "-an", output]);
  }
}

function loadMap() {
  if (!fs.existsSync(MAP_PATH)) return {};
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
}

function saveMap(map) {
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
}

function replaceLinks(files, map) {
  const pairs = Object.entries(map)
    .filter(([, value]) => value && value.newUrl)
    .sort((a, b) => b[0].length - a[0].length);
  let filesChanged = 0;
  let linksChanged = 0;
  for (const file of files) {
    let text = fs.readFileSync(file, "utf8");
    const original = text;
    for (const [oldUrl, value] of pairs) {
      if (!text.includes(oldUrl)) continue;
      const count = text.split(oldUrl).length - 1;
      text = text.split(oldUrl).join(value.newUrl);
      linksChanged += count;
    }
    if (file.endsWith(`${path.sep}index.html`) || file.endsWith("/index.html")) {
      const stillUsesAws = text.includes(`${AWS_BASE}/`);
      if (!stillUsesAws && text.includes(AWS_BASE)) {
        text = text.split(AWS_BASE).join(R2_BASE);
      }
    }
    if (text !== original) {
      fs.writeFileSync(file, text);
      filesChanged += 1;
    }
  }
  return { filesChanged, linksChanged };
}

async function main() {
  if (!AWS_BASE.startsWith("http")) {
    throw new Error("AWS_S3_PUBLIC_BASE_URL is missing");
  }
  const files = sourceFiles();
  const urls = collectUrls(files);
  const items = [...urls.keys()].map((url) => {
    const ext = extensionOf(url);
    return {
      url,
      ext,
      kind: kindFor(ext),
      usedIn: urls.get(url),
    };
  });
  items.sort((a, b) => a.kind.localeCompare(b.kind) || a.url.localeCompare(b.url));

  const images = items.filter((item) => item.kind === "image").length;
  const videos = items.filter((item) => item.kind === "video").length;
  console.log(`Source files scanned: ${files.length}`);
  console.log(`Unique media links: ${items.length} (${images} images, ${videos} videos)`);
  console.log(`Images will become WebP. Videos will become MP4.`);
  if (!APPLY) {
    for (const item of items) {
      const key = nextKey(objectPath(item.url), item.kind);
      console.log(`${item.kind.padEnd(5)} ${item.url}`);
      console.log(`      -> ${R2_BASE ? publicUrl(key) : key}`);
    }
    console.log("\nDry run only. Run with --apply to upload and replace links.");
    return;
  }

  if (!R2_BASE || !process.env.R2_ENDPOINT || !process.env.R2_BUCKET) {
    throw new Error("Set R2_ENDPOINT, R2_BUCKET, and R2_PUBLIC_BASE_URL in backend/.env");
  }
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in backend/.env");
  }

  await run("ffmpeg", ["-version"]);
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const map = loadMap();
  const failures = [];
  let index = 0;
  for (const item of items) {
    index += 1;
    const label = `[${index}/${items.length}]`;
    if (map[item.url] && map[item.url].newUrl) {
      console.log(`${label} skip ${item.url}`);
      continue;
    }
    const key = nextKey(objectPath(item.url), item.kind);
    const sourcePath = path.join(CACHE_DIR, `src-${index}.${item.ext}`);
    const outExt = item.kind === "image" ? "webp" : "mp4";
    const outPath = path.join(CACHE_DIR, `out-${index}.${outExt}`);
    try {
      process.stdout.write(`${label} ${item.kind} ${item.url}\n`);
      await download(item.url, sourcePath);
      if (item.kind === "image" && item.ext === "webp") {
        fs.copyFileSync(sourcePath, outPath);
      } else if (item.kind === "image") {
        await convertImage(sourcePath, outPath);
      } else {
        await convertVideo(sourcePath, outPath);
      }
      const body = fs.readFileSync(outPath);
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: item.kind === "image" ? "image/webp" : "video/mp4",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      map[item.url] = {
        newUrl: publicUrl(key),
        key,
        kind: item.kind,
        bytes: body.length,
      };
      saveMap(map);
      console.log(`${label} uploaded ${publicUrl(key)} (${body.length} bytes)`);
    } catch (error) {
      failures.push({ url: item.url, error: error.message });
      console.error(`${label} FAILED ${item.url}\n${error.message}`);
    } finally {
      for (const file of [sourcePath, outPath]) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    }
  }

  const replaced = replaceLinks(files, map);
  console.log(
    `\nReplaced ${replaced.linksChanged} link(s) in ${replaced.filesChanged} file(s).`,
  );
  console.log(`Uploaded or already mapped: ${Object.keys(map).length}`);
  console.log(`Failed: ${failures.length}`);
  if (failures.length) {
    for (const failure of failures) {
      console.error(`- ${failure.url}\n  ${failure.error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
