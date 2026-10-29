#!/usr/bin/env node
// Upload 1 file len S3 cua cong ty thong qua app hub.
// Client chi can API key — server giu S3 key va ky request.
// Zero-dependency: multipart/form-data dung tay bang Buffer.

const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Bien da export o shell thang truoc, khong co thi lay <cwd>/.env
const ENV_PATH = path.join(process.cwd(), ".env");
try {
  process.loadEnvFile(ENV_PATH);
} catch (e) {
  if (e.code !== "ENOENT") {
    console.error(`Cannot load env file "${ENV_PATH}": ${e.message}`);
    process.exit(1);
  }
}

const HOST = "hub.hbcommerce.co";
const UPLOAD_PATH = "/api/s3/upload";
const TOKEN = process.env.HUB_SKILL_TOKEN;
const MAX_BYTES = 25 * 1024 * 1024;

if (!TOKEN) {
  console.error(`Missing HUB_SKILL_TOKEN. Export it in your shell, or add it to "${ENV_PATH}".`);
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node upload.cjs <file>");
  process.exit(1);
}
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const stats = fs.statSync(filePath);
if (stats.isDirectory()) {
  console.error(`Path is a directory, not a file: ${filePath}`);
  process.exit(1);
}
if (stats.size > MAX_BYTES) {
  const mb = (stats.size / 1024 / 1024).toFixed(1);
  console.error(`File is ${mb}MB — the API rejects anything over 25MB.`);
  process.exit(1);
}

// Ten file trong header multipart: bo dau nhay kep de khong vo header
const fileName = path.basename(filePath).replace(/"/g, "");
const boundary = `----hubshared${crypto.randomBytes(16).toString("hex")}`;

const head = Buffer.from(
  `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: application/octet-stream\r\n\r\n`
);
const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
const body = Buffer.concat([head, fs.readFileSync(filePath), tail]);

const req = https.request(
  {
    hostname: HOST,
    port: 443,
    path: UPLOAD_PATH,
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length,
    },
  },
  (res) => {
    let raw = "";
    res.on("data", (c) => (raw += c));
    res.on("end", () => {
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        // IIS chan file qua lon truoc khi toi API -> tra HTML, khong phai JSON
        console.error(`Upload failed (HTTP ${res.statusCode}), response is not JSON:`);
        console.error(raw.slice(0, 500));
        process.exit(1);
      }

      if (res.statusCode >= 200 && res.statusCode < 300 && json.url) {
        console.log(`Uploaded: ${json.name} (${json.size} bytes)`);
        console.log(json.url);
      } else {
        console.error(`Upload failed (HTTP ${res.statusCode}): ${json.error || raw}`);
        process.exit(1);
      }
    });
  }
);

req.on("error", (e) => {
  console.error(`Network error: ${e.message}`);
  process.exit(1);
});

req.write(body);
req.end();
