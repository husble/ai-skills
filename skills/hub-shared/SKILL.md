---
name: hub-shared
description: Upload file lên S3 của công ty qua app hub và trả về link public trên CDN. Dùng khi user nói "share file này", "up file lên hub", "gửi link file", "host cái ảnh/pdf này", hoặc cần một URL công khai cho file local.
---

# Hub Shared

## Tổng quan

Skill đẩy **1 file local** lên S3 thông qua API của app hub, rồi in ra link public qua CloudFront.

Điểm chính: **máy anh không cầm key S3**. Script chỉ gửi kèm một API key, server mới là bên ký request và đẩy file lên bucket.

Script `scripts/upload.cjs` là Node thuần — **không cần `npm install`**, không dùng thư viện ngoài (`multipart/form-data` dựng tay bằng `Buffer`).

## Chuẩn bị

Cần đúng **1 biến môi trường**:

- `HUB_SKILL_TOKEN` — API key của hub

Script đọc theo thứ tự: biến đã **`export` ở shell thắng trước**, không có thì mới lấy từ `<thư-mục-hiện-tại>/.env`. Thiếu token thì script báo lỗi và dừng.

## Cách dùng

```bash
node <skill-dir>/scripts/upload.cjs <đường-dẫn-file>
```

`<skill-dir>` là thư mục chứa skill này:
- Claude Code: `~/.claude/skills/hub-shared`
- Codex: `~/.codex/skills/hub-shared`
- Trong repo: `skills/hub-shared`

In ra 2 dòng — tên file + dung lượng, rồi link:

```
Uploaded: report.pdf (182044 bytes)
https://files.hbcommerce.co/app-hub/shared/Website/26102910351234567_report.pdf
```

Lỗi thì in thông báo từ server và thoát với exit code 1.

## Quy trình

1. User nhờ share / up / host một file
2. Kiểm tra file có tồn tại không
3. Chạy `upload.cjs` với đường dẫn file đó
4. Đưa link trong output cho user

## Giới hạn & lưu ý

- **Tối đa 25MB** mỗi file, mỗi lần 1 file. Script tự kiểm tra dung lượng trước khi gửi nên không phải chờ upload rồi mới ăn lỗi
- **Link là public** — ai có link cũng mở được. Đừng up file chứa thông tin nhạy cảm
- **Không bao giờ ghi đè** — mỗi lần upload có ID riêng trước tên file, up cùng một file 2 lần ra 2 link khác nhau
- **Tên file trong URL bị làm sạch** — ký tự ngoài `A-Z a-z 0-9 . _ -` đổi thành `-` (vd `Báo cáo.pdf` → `B-o-c-o.pdf`). Tên gốc vẫn hiện ở dòng `Uploaded:`
- **Content-Type** do S3 tự suy từ đuôi file, nên ảnh và PDF mở thẳng được trên trình duyệt
- File lớn hơn ~28.6MB bị IIS chặn trước khi tới API — khi đó server trả HTML chứ không phải JSON, script sẽ in nguyên đoạn đầu response để dễ nhận ra

## Tài nguyên

### scripts/upload.cjs
Script Node zero-dependency: kiểm tra file, dựng `multipart/form-data`, `POST /api/s3/upload` kèm header `Authorization: Bearer`, rồi parse JSON lấy `url`.
