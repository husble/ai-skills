# Palette — PAPER (vintage editorial)

Skill chỉ còn **một bộ màu duy nhất**: giấy ngà, mực nâu đen, kiểu báo in / letterpress.
Template đã set sẵn — **không phải làm gì thêm** khi dựng file mới.

Tài liệu này để tra màu khi cần thêm thành phần mới, hoặc khi muốn chỉnh tông.

## Bảng màu

```css
--bg:           #bcb5a8;   /* nền ngoài trang giấy */
--surface:      #eee4cf;   /* mặt giấy */
--surface-soft: #e6dbc4;   /* giấy đậm hơn một nấc */
--ink:          #29251e;   /* mực — chữ chính */
--muted:        #655b49;   /* chữ phụ, nhãn */
--line:         #b9ac94;   /* đường kẻ, viền */
--brand:        #75543c;   /* nâu nhấn — kicker, eyebrow, link */
--brand-dark:   #553b29;   /* nâu đậm — badge, số liệu nhấn */
--brand-soft:   #e2d5ba;   /* nền badge/callout */
--shadow:       0 2px 2px rgba(62,52,43,.08), 0 18px 55px rgba(62,52,43,.22);
--radius:       3px;       /* giấy gần như không bo góc */
```

**Màu ngữ nghĩa** (badge/callout theo ý nghĩa, đã hạ tông cho hợp nền kem):

```css
--accent: #8a6a2f;  --accent-soft: #e8dcbd;   /* cảnh báo  */
--danger: #8c3b2f;  --danger-soft: #e7d2c6;   /* nguy hiểm */
--blue:   #3f5d75;  --blue-soft:   #d9ddd9;   /* thông tin */
--purple: #6a5570;  --purple-soft: #e0d6d8;   /* phụ       */
```

## Texture giấy

Biến `--grain` tạo hạt giấy, đắp lên `.hero` và `.card`:

```css
--grain:
  radial-gradient(rgba(89,65,42,.09) .42px, transparent .65px),
  repeating-linear-gradient(93deg, rgba(120,97,64,.014) 0, rgba(120,97,64,.014) 1px, transparent 1px, transparent 7px);
```

Dùng kèm `background-size: 5px 5px, auto`. Thiếu dòng `background-size` thì hạt sẽ to bất thường.

## Chữ

- **Body + heading:** `Georgia, "Times New Roman", "Noto Serif", serif`
- **Nhãn nhỏ** (`.eyebrow`, `.section-kicker`, `.badge`, `.nav-label`, `.hero-stat span`, `.timeline-time`...): `Arial, Helvetica, sans-serif`
- Heading để `font-weight: 400` + `letter-spacing` âm — chữ serif đậm sẵn, bold nữa là nặng mặt

## Độ tương phản (đã đo, WCAG 2.1)

| Cặp màu | Ratio | Mức |
|---|---:|---|
| `--ink` trên `--surface` | 12.07 | AAA |
| `--ink` trên `--surface-soft` | 11.10 | AAA |
| `--muted` trên `--surface` | 5.29 | AA |
| `--muted` trên `--surface-soft` | 4.86 | AA |
| `--brand` trên `--surface` | 5.38 | AA |
| Chữ sidebar trên nền sidebar | 8.58 | AAA |

⚠️ Đổi `--muted` sáng hơn `#655b49` là **rớt AA** trên nền `--surface-soft` (ngưỡng rất sát). Muốn đổi thì đo lại.

## Muốn đổi tông khác

1. Mở `template.html`, sửa khối `:root` ở đầu `<style>`
2. Sửa thêm `.sidebar` (nền `#40372d`) vì nó không ăn theo biến
3. Đo lại tương phản trước khi chốt — nền kem rất dễ rớt chuẩn ở chữ phụ
