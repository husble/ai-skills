# Palettes — 4 bộ màu

Chỉ thay khối `:root` và 2 chỗ dùng màu nền (body gradient + sidebar). **Mọi thứ khác giữ nguyên.**

Các biến ngữ nghĩa (`--accent`, `--danger`, `--blue`, `--purple` + `-soft`) **giữ nguyên ở cả 4 palette** — chúng dùng cho badge/callout theo ý nghĩa (cảnh báo / nguy hiểm / thông tin), không phải màu thương hiệu.

---

## 1. GREEN (mặc định — bản gốc)

```css
--bg: #f5f7f2;  --surface: #ffffff;  --surface-soft: #f0f4eb;
--ink: #15221b; --muted: #607065;    --line: #dbe3d8;
--brand: #167552; --brand-dark: #0d533a; --brand-soft: #dff4e9;
--shadow: 0 16px 50px rgba(26, 56, 40, 0.1);
```
- `body` gradient: `radial-gradient(circle at 90% 0%, rgba(240,161,58,.12), transparent 32%), linear-gradient(180deg,#f8faf5 0%,var(--bg) 100%)`
- `.sidebar` nền: `linear-gradient(165deg, rgba(255,255,255,.06), transparent 42%), #123f30`

## 2. BLUE

```css
--bg: #f2f5f9;  --surface: #ffffff;  --surface-soft: #eaf0f7;
--ink: #141c26; --muted: #5d6b7d;    --line: #d7dfe9;
--brand: #2f66b2; --brand-dark: #1e4a86; --brand-soft: #e3edfb;
--shadow: 0 16px 50px rgba(24, 45, 78, 0.1);
```
- `body` gradient: `radial-gradient(circle at 90% 0%, rgba(240,161,58,.10), transparent 32%), linear-gradient(180deg,#f7f9fc 0%,var(--bg) 100%)`
- `.sidebar` nền: `linear-gradient(165deg, rgba(255,255,255,.06), transparent 42%), #16304f`

## 3. PURPLE

```css
--bg: #f6f4fa;  --surface: #ffffff;  --surface-soft: #efeaf7;
--ink: #1c1726; --muted: #6a6180;    --line: #e0d9ec;
--brand: #7256a8; --brand-dark: #513a7d; --brand-soft: #f0ebfb;
--shadow: 0 16px 50px rgba(52, 36, 84, 0.1);
```
- `body` gradient: `radial-gradient(circle at 90% 0%, rgba(240,161,58,.10), transparent 32%), linear-gradient(180deg,#faf8fd 0%,var(--bg) 100%)`
- `.sidebar` nền: `linear-gradient(165deg, rgba(255,255,255,.06), transparent 42%), #2e2447`
- ⚠️ Palette này thì badge `.purple` trùng brand → dùng `.blue` hoặc `.orange` để nhấn.

## 4. ORANGE

```css
--bg: #faf6f1;  --surface: #ffffff;  --surface-soft: #f7efe4;
--ink: #26190f; --muted: #7a685a;    --line: #ebdfd2;
--brand: #c9761b; --brand-dark: #9a5711; --brand-soft: #ffeed8;
--shadow: 0 16px 50px rgba(94, 56, 16, 0.1);
```
- `body` gradient: `radial-gradient(circle at 90% 0%, rgba(47,102,178,.10), transparent 32%), linear-gradient(180deg,#fdfaf6 0%,var(--bg) 100%)`
  *(đổi tint góc phải sang xanh dương cho tương phản, vì brand đã là cam)*
- `.sidebar` nền: `linear-gradient(165deg, rgba(255,255,255,.06), transparent 42%), #4a2f13`
- ⚠️ Palette này thì badge `.orange` trùng brand → dùng `.blue` hoặc `.purple` để nhấn.

---

## Cách áp dụng

1. Mở `template.html`, tìm khối `:root { ... }` ở đầu `<style>`
2. Thay 9 biến: `--bg`, `--surface-soft`, `--ink`, `--muted`, `--line`, `--brand`, `--brand-dark`, `--brand-soft`, `--shadow`
3. Tìm `body { background: ... }` → thay gradient
4. Tìm `.sidebar { background: ... }` → thay màu nền
5. `--surface`, `--radius`, `--sidebar`, `--max` và các màu ngữ nghĩa: **không đổi**
