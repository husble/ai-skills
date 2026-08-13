---
name: gen-html
description: Tạo report hoặc tài liệu bằng HTML theo template UI có sẵn — self-contained 1 file, sidebar + hero + card/callout/timeline, 4 palette màu, in được PDF. Dùng khi user nói "tạo report HTML", "làm tài liệu HTML", "viết doc HTML", "gen-html", "xuất báo cáo dạng web".
---

# gen-html

Dựng report / tài liệu HTML theo template chuẩn — **1 file duy nhất, không dependency**.

## Tài nguyên

- `references/template.html` — khung đầy đủ (CSS + JS inline), có `{{PLACEHOLDER}}`
- `references/components.md` — markup từng component
- `references/palettes.md` — 4 bộ màu

---

## Quy trình

### 1. Hỏi user 2 điều (nếu chưa nói rõ)

- **Màu:** `green` (mặc định) · `blue` · `purple` · `orange`
- **Nội dung/dữ liệu** lấy từ đâu

Không hỏi lại nếu user đã nêu trong yêu cầu.

### 2. Chọn layout theo độ dài

- **≥ 3 section** → giữ sidebar (mặc định)
- **< 3 section** → **bỏ sidebar**, xem mục "Chế độ không sidebar" bên dưới

### 3. Dựng file

1. Copy `references/template.html` sang file đích
2. Áp palette theo `references/palettes.md` nếu không phải `green`
3. Thay toàn bộ `{{PLACEHOLDER}}`
4. Nhân bản `<section>` cho mỗi phần, thêm `<a>` tương ứng vào sidebar nav
5. Lấy markup component từ `references/components.md`

### 4. Lưu

- Project có `CLAUDE.md` / `AGENTS.md` quy định chỗ lưu → theo đó (thường là `reports/`)
- Không có quy định → hỏi user muốn lưu đâu

### 5. Verify trước khi báo xong

```bash
# Còn placeholder chưa thay?
grep -oE '\{\{[A-Z_0-9]+\}\}' <file> | sort -u

# Cấu trúc đủ thẻ đóng?
grep -cE '</style>|</script>|</body>|</html>' <file>    # phải = 4
```

Còn `{{...}}` sót → **chưa xong**, phải xử lý hết.

### 6. Hỏi user có muốn share không

File là HTML self-contained nên gửi thẳng hoặc up lên bất kỳ static host / CDN nào cũng chạy được. Nếu môi trường có sẵn skill upload riêng thì dùng skill đó.

**Không tự up.** Hỏi trước — file có thể chứa dữ liệu nội bộ.

---

## Chế độ không sidebar (tài liệu ngắn)

Khi bỏ `<aside class="sidebar">`, phải sửa thêm 3 chỗ:

1. Xoá cả khối `<aside>...</aside>`
2. Xoá `<div class="mobile-bar">...</div>` (nút ☰ không còn tác dụng)
3. Thêm override vào cuối `<style>`:

```css
.main { margin-left: 0; }
.page { margin: 0 auto; }
```

JS vẫn chạy bình thường — phần menu tự no-op vì `menuButton` là `null` (đã có `?.`).

---

## Nguyên tắc nội dung

- **Ưu tiên list / card, TRÁNH bảng** — bảng rất khó đọc trên điện thoại. Dùng `card`, `metric`, `precedence`, `timeline` thay cho table.
- **Tiếng Việt**, keyword kỹ thuật giữ tiếng Anh.
- **Số liệu phải có nguồn** — dùng `source-box` ghi rõ nguồn + thời điểm. Không phỏng đoán.
- Hero: 3-4 `hero-stat` là đẹp nhất. Không có số liệu thì bỏ cả khối.
- Mỗi section mở đầu đủ bộ 3: `section-kicker` → `section-title` → `section-intro`.
- Emoji icon trong `.icon` và `.callout` phải có `aria-hidden="true"`.

## Những gì template đã lo sẵn — đừng viết lại

- Progress bar theo scroll
- Scroll-spy tự highlight mục đang xem ở sidebar
- Copy-to-clipboard + toast (chỉ cần `data-copy="<id>"` khớp `id` của `<pre>`)
- Mobile menu, responsive 3 breakpoint (1100 / 820 / 590px)
- `@media print` — nút "🖨️ In / lưu PDF" có sẵn trên hero
- `skip-link` + `aria-label` cho accessibility

## Ràng buộc

- ✅ Self-contained: CSS + JS **inline**, không CDN, không framework
- ✅ Không nhúng ảnh ngoài — cần ảnh thì dùng data URI hoặc emoji
- ❌ Không thêm thư viện (Tailwind, Bootstrap, Chart.js...) — phá tính self-contained
