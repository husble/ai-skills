---
name: gen-images
description: Generate images with AI - text-to-image and image-to-image (edit/variation) via Gemini (default) or OpenAI. Use when the user asks to "gen ảnh", "tạo ảnh", "vẽ ảnh", "text to image", "image to image", "edit ảnh bằng AI", "làm mockup ảnh", or wants image variations from a reference image.
---

# Gen Images

## Overview

Gen ảnh bằng AI qua 1 script Node zero-dependency (`scripts/gen.mjs`, dùng native `fetch`).
Hỗ trợ 2 chế độ trong cùng 1 CLI:

- **text-to-image**: chỉ truyền `--prompt`.
- **image-to-image**: truyền thêm `--image <path>` (lặp lại được nhiều lần) để edit / tạo biến thể từ ảnh gốc.

## Setup

Cần **Node.js 18+** (script dùng native `fetch`, không cài package nào).

API key đọc từ biến môi trường:

- `GEMINI_API_SKILL` - cho provider `gemini` ([lấy key](https://aistudio.google.com/apikey))
- `OPENAI_API_SKILL` - cho provider `openai` ([lấy key](https://platform.openai.com/api-keys))

Cách set (chỉ cần provider nào thì set key đó):

```bash
# macOS / Linux — thêm vào ~/.zshrc hoặc ~/.bashrc rồi mở lại terminal
export GEMINI_API_SKILL="your-key-here"
```

```powershell
# Windows PowerShell — set vĩnh viễn cho user, mở lại terminal là có
[Environment]::SetEnvironmentVariable("GEMINI_API_SKILL", "your-key-here", "User")
```

Thiếu key → script exit code 1 kèm message rõ ràng, không fail im lặng.

## Usage

Script nằm ở `scripts/gen.mjs` **cùng thư mục với file `SKILL.md` này** — gọi thư mục đó là `<skill-dir>`:

```bash
node <skill-dir>/scripts/gen.mjs --prompt "<text>" [options]
```

`<skill-dir>` tuỳ agent và nơi cài:

- Claude Code (global) — `~/.claude/skills/gen-images` · Windows: `%USERPROFILE%\.claude\skills\gen-images`
- Codex CLI (global) — `~/.codex/skills/gen-images` · Windows: `%USERPROFILE%\.codex\skills\gen-images`
- Cài riêng trong project — `.claude/skills/gen-images` hoặc `.codex/skills/gen-images` ngay trong repo

Các ví dụ bên dưới viết tắt là `<skill-dir>/scripts/gen.mjs` — thay bằng path thật khi chạy.

Options:

- `--prompt <text>` - prompt (bắt buộc, trừ khi dùng `--prompt-file`)
- `--prompt-file <path>` - đọc prompt từ file (prompt dài / nhiều dòng)
- `--provider gemini|openai` - default `gemini`
- `--model <id>` - override model. Alias Gemini: `flash`, `flash-lite`, `pro`
- `--count, -n <N>` - số ảnh, default `1`
- `--image, -i <path>` - ảnh input cho image-to-image, lặp nhiều lần được (png/jpg/webp/gif)
- `--out, -o <dir>` - thư mục output, default `./gen-images`
- `--aspect <ratio>` - **chỉ Gemini**: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`...
- `--size <WxH>` - **chỉ OpenAI**: `1024x1024`, `1536x1024`, `1024x1536`, `auto`
- `--json` - in JSON summary (dùng khi agent cần parse kết quả)

## Models

**Gemini** (default provider) - endpoint `generateContent`, dùng chung cho cả t2i và i2i:

- `gemini-3.1-flash-image` (**default**, alias `flash`) - nhanh, rẻ
- `gemini-3.1-flash-lite-image` (alias `flash-lite`) - rẻ nhất
- `gemini-3-pro-image` (alias `pro`) - chất lượng cao nhất, chậm + đắt hơn
- `gemini-2.5-flash-image` - bản cũ, chỉ dùng khi cần so sánh

**OpenAI**:

- `gpt-image-2` (**default**)
- `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`

## Output

- File lưu vào `--out` (default `./gen-images`), tên `<slug-prompt>-<YYYYMMDD-HHmmss>-<index>.<ext>`.
- Extension theo mime API trả về: Gemini thường trả **JPEG**, OpenAI trả **PNG**.
- Script in ra đường dẫn tuyệt đối từng file → dùng tiếp cho báo cáo / gửi user.

## Workflow cho agent

1. Xác định mode: user có đưa ảnh input không → có thì image-to-image.
2. Nếu user không nói provider → dùng `gemini` (default). Chỉ đổi sang `openai` khi user yêu cầu, hoặc khi Gemini fail vì content policy.
3. Nếu user không nói số lượng → `--count 1`.
4. Chạy script với `--json`, đọc `files[]` và `errors[]`.
5. Gửi ảnh cho user (SendUserFile) hoặc nhúng vào report bằng relative path.

**Prompt tips:**

- Prompt tả cảnh cụ thể (subject + style + lighting + background) cho kết quả tốt hơn keyword rời rạc.
- Image-to-image: nói rõ cái gì ĐỔI và cái gì GIỮ NGUYÊN, ví dụ `"make it wear a red santa hat, keep everything else identical"`.
- Cần nhiều ảnh khác nhau rõ rệt → chạy nhiều lần với prompt khác nhau, thay vì tăng `--count` (count chỉ tạo biến thể cùng prompt).

**Lưu ý per-project:** nếu project có `CLAUDE.md` / `AGENTS.md` quy định chỗ chứa output (thường là `reports/`) thì luôn truyền `--out` theo đúng quy định đó, đừng để mặc định `./gen-images`.

## Behavior

- **Gemini**: 1 API call = 1 ảnh → `--count N` chạy N call song song, concurrency tối đa 3 (tránh 429).
- **OpenAI**: dùng param `n` (tối đa 10/call), count > 10 tự chia batch. Image-to-image gọi `/v1/images/edits` (multipart), text-to-image gọi `/v1/images/generations`.
- Retry 1 lần khi gặp 429 / 5xx (backoff 5s / 2s).
- Ảnh nào lỗi thì skip và ghi vào `errors[]`, các ảnh còn lại vẫn được save. Exit code 1 nếu không save được ảnh nào.

## Examples

```bash
# Text-to-image, 4 ảnh, khổ ngang, Gemini default
node <skill-dir>/scripts/gen.mjs \
  --prompt "cozy coffee shop interior, warm morning light, cinematic" \
  --count 4 --aspect 16:9 --out reports/coffee-mockups

# Image-to-image: đổi background của ảnh sản phẩm
node <skill-dir>/scripts/gen.mjs \
  --prompt "replace the background with a marble kitchen countertop, keep the mug unchanged" \
  -i sources/mug.png --count 2

# Ghép nhiều ảnh input (product + model reference)
node <skill-dir>/scripts/gen.mjs \
  --prompt "put the shirt design onto the model, natural fabric folds" \
  -i sources/design.png -i sources/model.jpg

# OpenAI, chất lượng cao, output JSON
node <skill-dir>/scripts/gen.mjs --provider openai \
  --prompt "minimal flat-design logo of a happy dog, white background" \
  --size 1024x1024 --json

# Gemini pro model
node <skill-dir>/scripts/gen.mjs --model pro \
  --prompt "hyper-detailed product shot of a leather wallet on dark wood"
```
