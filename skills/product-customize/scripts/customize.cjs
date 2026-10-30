#!/usr/bin/env node
// Doc xem mot san pham cho khach custom nhung gi.
//
// Nhan URL san pham hoac product ID. La URL thi lay ID qua <url>.js cua Shopify,
// roi goi GET /api/product/{id}/customize cua app hub.
//
// Du lieu tho tu 3 provider (customall / teeinblue / customily) khong deu nhau:
// co selector trung lap, field divider "====", kind "unknown" that ra la anh hoac
// clipart, dieu kien tro ID tho khong doc duoc. Script lam sach truoc khi in,
// va liet ke ro da lam gi o muc "Ghi chu" cuoi output.

const https = require("https");
const path = require("path");

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
const TOKEN = process.env.HUB_SKILL_TOKEN;

// ---------------------------------------------------------------- args

const args = process.argv.slice(2);
let target = null;
let mode = "text"; // text | json | raw
let full = false;
let outFile = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--json") mode = "json";
  else if (a === "--raw") mode = "raw";
  else if (a === "--full") full = true;
  else if (a === "-o" || a === "--out") outFile = args[++i];
  else if (a.startsWith("-")) {
    console.error(`Khong hieu tham so: ${a}`);
    process.exit(1);
  } else if (!target) target = a;
}

if (!target) {
  console.error("Dung: node customize.cjs <url-san-pham | product-id> [--json|--raw] [--full -o file.json]");
  process.exit(1);
}

if (!TOKEN) {
  console.error(`Missing HUB_SKILL_TOKEN. Export it in your shell, or add it to "${ENV_PATH}".`);
  process.exit(1);
}

// Ban day du co the nang hang MB -> bat buoc ghi ra file, khong do vao man hinh
if (full && !outFile) {
  console.error("--full phai di kem -o <file>: ban day du co the nang vai MB, in ra se lam vo context.");
  process.exit(1);
}

// ---------------------------------------------------------------- http

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => resolve({ status: res.statusCode, raw }));
      })
      .on("error", reject);
  });
}

async function resolveProductId(input) {
  if (/^\d+$/.test(input)) return input;

  if (!/^https?:\/\//.test(input)) {
    throw new Error(`"${input}" khong phai URL cung khong phai product ID (chi gom chu so).`);
  }

  // Bo query string / hash roi them .js — endpoint cong khai cua Shopify.
  // Shopify tra 403 cho user-agent mac dinh cua Node nen phai gia lam trinh duyet.
  const clean = input.split("?")[0].split("#")[0].replace(/\/+$/, "");
  const { status, raw } = await getJson(`${clean}.js`, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    Accept: "application/json",
  });
  if (status !== 200) {
    throw new Error(`Khong lay duoc product ID tu ${clean}.js (HTTP ${status}).`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${clean}.js khong tra ve JSON — co phai link san pham Shopify khong?`);
  }
  if (!data.id) throw new Error(`${clean}.js khong co truong "id".`);
  return String(data.id);
}

// ---------------------------------------------------------------- lam sach

const DIVIDER = /^[=\-_*~.\s]+$/; // label chi gom ky tu trang tri

function normalizeKind(field) {
  if (field.kind !== "unknown") return { kind: field.kind, note: null };

  const raw = String(field.rawType || "");
  if (/image/i.test(raw)) return { kind: "photo", note: `API tra kind "unknown" (${raw})` };
  if (/clipart/i.test(raw)) {
    return { kind: "clipart", note: `API tra kind "unknown" (${raw}) — khong doc duoc danh sach hinh` };
  }
  return { kind: "unknown", note: raw ? `rawType: ${raw}` : null };
}

// Dieu kien chi co nghia khi ve trai la ten field co that trong cung selector
// va ve phai khong rong. Loai bo "_v1gx7 = option-1" va "X =  |  | ".
function cleanCondition(expr, knownLabels) {
  if (!expr) return null;

  const parts = String(expr).split(/\s+(AND|OR)\s+/);
  const kept = [];
  let dropped = 0;

  for (let i = 0; i < parts.length; i += 2) {
    const clause = parts[i];
    const joiner = parts[i - 1];
    const eq = clause.indexOf("=");
    if (eq === -1) {
      dropped++;
      continue;
    }
    const left = clause.slice(0, eq).trim();
    const right = clause.slice(eq + 1);
    const values = right.split("|").map((v) => v.trim()).filter(Boolean);

    if (!knownLabels.has(left) || values.length === 0) {
      dropped++;
      continue;
    }
    kept.push((kept.length && joiner ? `${joiner} ` : "") + `${left} = ${values.join(" | ")}`);
  }

  return { text: kept.join(" ") || null, dropped };
}

function cleanOneSelector(sel) {
  const notes = [];
  {
    const rawFields = sel.fields || [];
    const knownLabels = new Set(rawFields.map((f) => f.label).filter(Boolean));

    let dividers = 0;
    let condDropped = 0;
    const merged = new Map();

    for (const f of rawFields) {
      if (!f.label || DIVIDER.test(f.label)) {
        dividers++;
        continue;
      }

      const { kind, note } = normalizeKind(f);

      // Chi gop khi MOI thuoc tinh giong nhau, chi khac dieu kien hien/an.
      // Customall hay lap y het mot field voi 2 showWhen -> gop duoc.
      // Nhung Customily co "Type Dogs' Names" 2 lan voi maxLength 30 va 45
      // (2 cho va 3 cho) -> gop vao la bao sai gioi han ky tu.
      const key = JSON.stringify([
        f.label,
        kind,
        f.required,
        f.maxLength,
        f.example,
        f.default,
        f.textCase,
        f.prefix,
        f.suffix,
        f.repeat,
        f.optionCount,
        f.totalOptionCount,
        f.options,
        f.effects,
      ]);

      const show = cleanCondition(f.showWhen, knownLabels);
      const hide = cleanCondition(f.hideWhen, knownLabels);
      condDropped += (show ? show.dropped : 0) + (hide ? hide.dropped : 0);

      if (!merged.has(key)) {
        merged.set(key, {
          label: f.label,
          kind,
          kindNote: note,
          required: f.required,
          maxLength: f.maxLength,
          example: f.example,
          default: f.default,
          textCase: f.textCase,
          prefix: f.prefix,
          suffix: f.suffix,
          effects: f.effects,
          repeat: f.repeat,
          options: f.options ? [...f.options] : undefined,
          optionCount: f.optionCount,
          totalOptionCount: f.totalOptionCount,
          showWhen: [],
          hideWhen: [],
          seen: 0,
        });
      }

      const m = merged.get(key);
      m.seen++;
      if (f.options) {
        m.options = m.options || [];
        for (const o of f.options) if (!m.options.includes(o)) m.options.push(o);
      }
      if (f.optionCount && (!m.optionCount || f.optionCount > m.optionCount)) m.optionCount = f.optionCount;
      if (show && show.text && !m.showWhen.includes(show.text)) m.showWhen.push(show.text);
      if (hide && hide.text && !m.hideWhen.includes(hide.text)) m.hideWhen.push(hide.text);
    }

    const fields = [...merged.values()];
    const dupes = fields.filter((f) => f.seen > 1);

    if (dividers) notes.push(`Bo ${dividers} field chi la duong ke trang tri.`);
    if (dupes.length) {
      notes.push(
        `Gop ${dupes.length} field bi lap: ${dupes.map((d) => `${d.label} x${d.seen}`).join(", ")}.`
      );
    }
    if (condDropped) notes.push(`Bo ${condDropped} dieu kien khong doc duoc (tro ID tho hoac gia tri rong).`);

    return {
      selector: {
        label: sel.label || null,
        values: sel.values || [],
        fields: fields.map(({ seen, ...rest }) => rest),
      },
      notes,
    };
  }
}

function cleanSelectors(apiSelectors) {
  const cleaned = (apiSelectors || []).map(cleanOneSelector);

  // Gop selector trung lap — so SAU khi lam sach, vi co product chi khac nhau
  // dung mot duong ke trang tri (plush doll tra 4 selector kieu nay).
  if (cleaned.length > 1) {
    const first = JSON.stringify(cleaned[0].selector);
    if (cleaned.every((c) => JSON.stringify(c.selector) === first)) {
      const n = cleaned.length;
      const kept = cleaned[0];
      return {
        selectors: [kept.selector],
        notes: [`API tra ${n} selector giong nhau — da gop lai con 1.`, ...dedupeNotes(kept.notes)],
      };
    }
  }

  return {
    selectors: cleaned.map((c) => c.selector),
    notes: dedupeNotes(cleaned.flatMap((c) => c.notes)),
  };
}

// Nhieu selector hay sinh ra note giong het nhau — gop lai, ghi so lan neu lap
function dedupeNotes(notes) {
  const count = new Map();
  for (const n of notes) count.set(n, (count.get(n) || 0) + 1);
  return [...count].map(([n, c]) => (c > 1 ? `${n} (x${c} selector)` : n));
}

// ---------------------------------------------------------------- in text

const KIND_VI = {
  text: "go chu",
  choice: "chon 1 trong nhieu",
  clipart: "chon hinh",
  photo: "upload anh",
  unknown: "khong ro",
};

function describeField(f, i) {
  const bits = [];
  bits.push(f.required === false ? "khong bat buoc" : f.required ? "bat buoc" : null);

  if (f.repeat) {
    const { min, max } = f.repeat;
    bits.push(min === max ? `lap ${max} lan` : `lap ${min}-${max} lan`);
  }
  if (f.maxLength) bits.push(`toi da ${f.maxLength} ky tu`);
  if (f.textCase) bits.push(f.textCase === "uppercase" ? "viet HOA" : f.textCase);
  if (f.prefix) bits.push(`tien to "${f.prefix}"`);
  if (f.suffix) bits.push(`hau to "${f.suffix}"`);
  if (f.example) bits.push(`vi du "${f.example}"`);
  if (f.default) bits.push(`mac dinh "${f.default}"`);
  if (f.effects && f.effects.length) bits.push(`hieu ung: ${f.effects.join(", ")}`);

  const head = `${String(i + 1).padStart(2)}. ${f.label}  [${KIND_VI[f.kind] || f.kind}]`;
  const lines = [head];
  if (bits.filter(Boolean).length) lines.push(`      ${bits.filter(Boolean).join(" · ")}`);

  if (f.options && f.options.length) {
    const total = f.totalOptionCount || f.optionCount || f.options.length;
    const shown = f.options.slice(0, 8).join(", ");
    const more = total > f.options.length ? ` … (${total} lua chon)` : total > 8 ? ` … (${total} lua chon)` : "";
    lines.push(`      Lua chon: ${shown}${more}`);
  } else if (f.optionCount) {
    lines.push(`      ${f.optionCount} lua chon (API khong tra danh sach)`);
  }

  if (f.showWhen.length) lines.push(`      Chi hien khi: ${f.showWhen.join("  HOAC  ")}`);
  if (f.hideWhen.length) lines.push(`      An khi: ${f.hideWhen.join("  HOAC  ")}`);
  if (f.kindNote) lines.push(`      (${f.kindNote})`);

  return lines.join("\n");
}

function printText(data, cleaned) {
  console.log(`Product : ${data.productId}`);
  console.log(`Store   : ${data.shop || data.store}`);
  console.log(`Provider: ${data.provider}${data.version ? `  (version ${data.version.slice(0, 12)}…)` : ""}`);

  const totalFields = cleaned.selectors.reduce((n, s) => n + s.fields.length, 0);
  console.log(`Tong    : ${cleaned.selectors.length} selector, ${totalFields} field khach dien`);

  cleaned.selectors.forEach((sel, si) => {
    console.log("");
    if (sel.label) {
      const vals = sel.values.length ? ` — ${sel.values.length} lua chon: ${sel.values.join(", ")}` : "";
      console.log(`== Selector: ${sel.label}${vals}`);
    } else if (cleaned.selectors.length > 1) {
      console.log(`== Nhom ${si + 1}`);
    } else {
      console.log("== Cac field khach dien");
    }
    sel.fields.forEach((f, i) => console.log(describeField(f, i)));
  });

  if (cleaned.notes.length) {
    console.log("");
    console.log("Ghi chu (script da lam sach du lieu tho):");
    cleaned.notes.forEach((n) => console.log(`  - ${n}`));
    console.log("  Nghi ngo thi chay lai voi --raw de xem ban goc tu API.");
  }
}

// ---------------------------------------------------------------- main

(async () => {
  let productId;
  try {
    productId = await resolveProductId(target);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  const url = `https://${HOST}/api/product/${productId}/customize${full ? "?short=0" : ""}`;
  const { status, raw } = await getJson(url, { Authorization: `Bearer ${TOKEN}` });

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`API tra ve khong phai JSON (HTTP ${status}):`);
    console.error(raw.slice(0, 500));
    process.exit(1);
  }

  if (status < 200 || status >= 300) {
    const msg = data.msg || (data.error && (data.error.message || data.error.code)) || data.error || raw;
    console.error(`Loi (HTTP ${status}): ${msg}`);
    process.exit(1);
  }

  if (outFile) {
    // Ghi nguyen response, khong format lai — ban day du da nang san
    require("fs").writeFileSync(outFile, raw);
    const bytes = require("fs").statSync(outFile).size;
    console.log(`Da ghi ${bytes} bytes vao ${outFile} (product ${productId}, provider ${data.provider}).`);
    return;
  }

  if (mode === "raw") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const cleaned = cleanSelectors(data.selectors);

  if (mode === "json") {
    console.log(
      JSON.stringify(
        {
          productId: data.productId,
          shop: data.shop || data.store,
          provider: data.provider,
          version: data.version,
          selectors: cleaned.selectors,
          notes: cleaned.notes,
        },
        null,
        2
      )
    );
    return;
  }

  printText(data, cleaned);
})();
