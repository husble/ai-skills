#!/usr/bin/env node
// gen-images: text-to-image & image-to-image via Gemini (default) or OpenAI.
// Zero dependencies - uses native fetch / FormData / Blob (Node 18+).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

const GEMINI_ALIAS = {
  flash: 'gemini-3.1-flash-image',
  'flash-lite': 'gemini-3.1-flash-lite-image',
  pro: 'gemini-3-pro-image',
};
const DEFAULT_MODEL = { gemini: 'gemini-3.1-flash-image', openai: 'gpt-image-2' };
const OPENAI_MAX_N = 10;
const GEMINI_CONCURRENCY = 3;
const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};
const EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

function parseArgs(argv) {
  const opts = { images: [], count: 1, provider: 'gemini', out: './gen-images', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) fail(`Missing value for ${a}`);
      return v;
    };
    switch (a) {
      case '--prompt': opts.prompt = next(); break;
      case '--prompt-file': opts.promptFile = next(); break;
      case '--provider': opts.provider = next().toLowerCase(); break;
      case '--model': opts.model = next(); break;
      case '--count': case '-n': opts.count = Number(next()); break;
      case '--image': case '-i': opts.images.push(next()); break;
      case '--out': case '-o': opts.out = next(); break;
      case '--aspect': opts.aspect = next(); break;
      case '--size': opts.size = next(); break;
      case '--json': opts.json = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: fail(`Unknown argument: ${a}`);
    }
  }
  return opts;
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

const USAGE = `Usage:
  node gen.mjs --prompt "<text>" [options]

Options:
  --prompt <text>        Prompt (required unless --prompt-file)
  --prompt-file <path>   Read prompt from a file
  --provider <name>      gemini (default) | openai
  --model <id>           Model id. Gemini aliases: flash, flash-lite, pro
                         Defaults: gemini=${DEFAULT_MODEL.gemini}, openai=${DEFAULT_MODEL.openai}
  --count, -n <N>        Number of images (default 1)
  --image, -i <path>     Input image for image-to-image (repeatable)
  --out, -o <dir>        Output directory (default ./gen-images)
  --aspect <ratio>       Gemini only: 1:1, 16:9, 9:16, 4:3, 3:4, ...
  --size <WxH>           OpenAI only: 1024x1024, 1536x1024, 1024x1536, auto
  --json                 Print a JSON summary instead of human text

Env: GEMINI_API_SKILL (gemini), OPENAI_API_SKILL (openai)`;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function mimeOf(path) {
  const mime = MIME_BY_EXT[extname(path).toLowerCase()];
  if (!mime) fail(`Unsupported input image type: ${basename(path)} (png/jpg/webp/gif only)`);
  return mime;
}

// Retries once on 429 / 5xx. Returns parsed JSON or throws with the API message.
async function callApi(url, init, label) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, init);
    } catch (e) {
      if (attempt === 0) { await sleep(2000); continue; }
      throw new Error(`${label}: network error - ${e.message}`);
    }
    if (res.ok) return res.json();
    const body = await res.text();
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt === 0) {
      await sleep(res.status === 429 ? 5000 : 2000);
      continue;
    }
    throw new Error(`${label}: HTTP ${res.status} - ${body.slice(0, 500)}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runPool(tasks, limit) {
  const results = new Array(tasks.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const i = cursor++;
      try {
        results[i] = { ok: true, value: await tasks[i]() };
      } catch (e) {
        results[i] = { ok: false, error: e.message };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

// --- Gemini: one image per call, so run `count` calls in a small pool. ---
async function genGemini({ prompt, model, count, images, aspect, apiKey }) {
  const parts = [{ text: prompt }];
  for (const path of images) {
    parts.push({
      inline_data: { mime_type: mimeOf(path), data: (await readFile(path)).toString('base64') },
    });
  }
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      ...(aspect ? { imageConfig: { aspectRatio: aspect } } : {}),
    },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const init = {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  };

  const results = await runPool(
    Array.from({ length: count }, (_, i) => async () => {
      const data = await callApi(url, init, `gemini call ${i + 1}`);
      const inline = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.inlineData ?? p.inline_data)
        .filter(Boolean);
      if (!inline.length) {
        const reason = data.candidates?.[0]?.finishReason ?? 'no image in response';
        throw new Error(`gemini call ${i + 1}: ${reason}`);
      }
      return inline.map((p) => ({ b64: p.data, mime: p.mimeType ?? p.mime_type ?? 'image/png' }));
    }),
    GEMINI_CONCURRENCY,
  );

  const out = { images: [], errors: [] };
  for (const r of results) {
    if (r.ok) out.images.push(...r.value);
    else out.errors.push(r.error);
  }
  return out;
}

// --- OpenAI: /generations for text-to-image, /edits for image-to-image. ---
async function genOpenai({ prompt, model, count, images, size, apiKey }) {
  const out = { images: [], errors: [] };
  const batches = [];
  for (let left = count; left > 0; left -= OPENAI_MAX_N) batches.push(Math.min(left, OPENAI_MAX_N));

  const files = await Promise.all(
    images.map(async (path) => ({ path, buf: await readFile(path), mime: mimeOf(path) })),
  );

  for (const [idx, n] of batches.entries()) {
    const label = `openai batch ${idx + 1}`;
    try {
      let init;
      let url;
      if (files.length) {
        url = 'https://api.openai.com/v1/images/edits';
        const form = new FormData();
        form.append('model', model);
        form.append('prompt', prompt);
        form.append('n', String(n));
        if (size) form.append('size', size);
        for (const f of files) {
          form.append('image[]', new Blob([f.buf], { type: f.mime }), basename(f.path));
        }
        init = { method: 'POST', headers: { authorization: `Bearer ${apiKey}` }, body: form };
      } else {
        url = 'https://api.openai.com/v1/images/generations';
        init = {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, prompt, n, ...(size ? { size } : {}) }),
        };
      }
      const data = await callApi(url, init, label);
      const items = (data.data ?? []).filter((d) => d.b64_json);
      if (!items.length) throw new Error(`${label}: no image in response`);
      out.images.push(...items.map((d) => ({ b64: d.b64_json, mime: 'image/png' })));
    } catch (e) {
      out.errors.push(e.message);
    }
  }
  return out;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    return;
  }

  let prompt = opts.prompt;
  if (opts.promptFile) prompt = (await readFile(opts.promptFile, 'utf8')).trim();
  if (!prompt) fail(`--prompt (or --prompt-file) is required.\n\n${USAGE}`);

  if (!['gemini', 'openai'].includes(opts.provider)) fail(`--provider must be gemini or openai`);
  if (!Number.isInteger(opts.count) || opts.count < 1) fail(`--count must be a positive integer`);
  if (opts.aspect && opts.provider !== 'gemini') fail(`--aspect is Gemini-only; use --size for OpenAI`);
  if (opts.size && opts.provider !== 'openai') fail(`--size is OpenAI-only; use --aspect for Gemini`);

  const envVar = opts.provider === 'gemini' ? 'GEMINI_API_SKILL' : 'OPENAI_API_SKILL';
  const apiKey = process.env[envVar];
  if (!apiKey) fail(`Missing env ${envVar}. Set it in your shell profile (or via setx on Windows) and reopen the terminal.`);

  const model = opts.provider === 'gemini'
    ? (GEMINI_ALIAS[opts.model] ?? opts.model ?? DEFAULT_MODEL.gemini)
    : (opts.model ?? DEFAULT_MODEL.openai);

  const images = opts.images.map((p) => resolve(p));
  for (const p of images) {
    try {
      await readFile(p);
    } catch {
      fail(`Input image not found: ${p}`);
    }
  }

  const args = { prompt, model, count: opts.count, images, apiKey, aspect: opts.aspect, size: opts.size };
  const result = opts.provider === 'gemini' ? await genGemini(args) : await genOpenai(args);

  const outDir = resolve(opts.out);
  await mkdir(outDir, { recursive: true });
  const base = `${slugify(prompt)}-${stamp()}`;
  const files = [];
  for (const [i, img] of result.images.entries()) {
    const path = `${outDir}/${base}-${i + 1}${EXT_BY_MIME[img.mime] ?? '.png'}`;
    await writeFile(path, Buffer.from(img.b64, 'base64'));
    files.push(path);
  }

  const summary = {
    provider: opts.provider,
    model,
    mode: images.length ? 'image-to-image' : 'text-to-image',
    requested: opts.count,
    files,
    errors: result.errors,
  };

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`${summary.mode} | ${opts.provider}/${model} | ${files.length}/${opts.count} image(s)`);
    for (const f of files) console.log(f);
    for (const e of result.errors) console.error(`FAILED: ${e}`);
  }

  if (!files.length) process.exit(1);
}

main().catch((e) => fail(e.stack ?? e.message));
