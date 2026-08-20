#!/usr/bin/env node

/**
 * AWS S3 Upload Script (Zero Dependencies)
 * Uses AWS Signature Version 4 for authentication.
 */

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const path = require('path');

// Nap .env: thu muc chua script truoc, roi di nguoc len tim .env o goc project,
// cuoi cung la cwd. KHONG ghi de bien da export san (export o shell van uu tien).
function loadEnv(startDir) {
  const candidates = [path.join(startDir, '.env')];
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
    candidates.push(path.join(dir, '.env'));
  }
  candidates.push(path.join(process.cwd(), '.env'));
  for (const f of candidates) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
    break;
  }
}
loadEnv(__dirname);

// Configuration from environment variables
const ACCESS_KEY = process.env.SHARED_AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.SHARED_AWS_SECRET_ACCESS_KEY;
const REGION = process.env.SHARED_AWS_REGION || 'us-east-1';
const BUCKET = process.env.SHARED_AWS_S3_BUCKET;
// Mac dinh dung URL S3 path-style dung tu bucket + region. Set SHARED_CDN_BASE_URL de doi sang CDN rieng.
const S3_HOST = REGION === 'us-east-1' ? 's3.amazonaws.com' : `s3.${REGION}.amazonaws.com`;
const BASE_URL = process.env.SHARED_CDN_BASE_URL || `https://${S3_HOST}/${BUCKET}`;

if (!ACCESS_KEY || !SECRET_KEY || !BUCKET) {
  console.error('Error: Missing required environment variables:');
  if (!ACCESS_KEY) console.error('  - SHARED_AWS_ACCESS_KEY_ID');
  if (!SECRET_KEY) console.error('  - SHARED_AWS_SECRET_ACCESS_KEY');
  if (!BUCKET) console.error('  - SHARED_AWS_S3_BUCKET');
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath || !fs.existsSync(filePath)) {
  console.error('Error: Provide a valid path to a file as the first argument.');
  process.exit(1);
}

const stats = fs.statSync(filePath);
if (stats.isDirectory()) {
  console.error('Error: Path is a directory. Please provide a file.');
  process.exit(1);
}

const fileName = path.basename(filePath);
const s3Key = `shared/${fileName}`;

// Detect MIME type based on extension
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
  '.md': 'text/markdown',
  '.mp4': 'video/mp4'
};
const ext = path.extname(fileName).toLowerCase();
const contentType = mimeTypes[ext] || 'application/octet-stream';

// AWS SigV4 Helpers
function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = sign('AWS4' + key, dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, 'aws4_request');
  return kSigning;
}

const fileContent = fs.readFileSync(filePath);
const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');

const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
const dateStamp = amzDate.slice(0, 8);

const host = S3_HOST;

const canonicalUri = `/${BUCKET}/${encodeURIComponent(s3Key).replace(/%2F/g, '/')}`;
const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDate}\n`;
const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

const canonicalRequest = [
  'PUT',
  canonicalUri,
  '',
  canonicalHeaders,
  signedHeaders,
  contentHash
].join('\n');

const algorithm = 'AWS4-HMAC-SHA256';
const credentialScope = `${dateStamp}/${REGION}/s3/aws4_request`;
const stringToSign = [
  algorithm,
  amzDate,
  credentialScope,
  crypto.createHash('sha256').update(canonicalRequest).digest('hex')
].join('\n');

const signingKey = getSignatureKey(SECRET_KEY, dateStamp, REGION, 's3');
const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

const authorizationHeader = `${algorithm} Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

const options = {
  hostname: host,
  port: 443,
  path: canonicalUri,
  method: 'PUT',
  headers: {
    'Host': host,
    'Content-Type': contentType,
    'Content-Length': fileContent.length,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': contentHash,
    'Authorization': authorizationHeader
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const publicUrl = `${BASE_URL}/${s3Key}`;
      console.log(`✅ Upload successful!`);
      console.log(`🔗 Public URL: ${publicUrl}`);
    } else {
      console.error(`❌ Upload failed (Status ${res.statusCode})`);
      console.error(body);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Network error: ${e.message}`);
  process.exit(1);
});

req.write(fileContent);
req.end();
