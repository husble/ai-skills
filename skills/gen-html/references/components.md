# Component catalog

Markup của từng component. CSS đã có sẵn trong `template.html` — chỉ cần copy markup vào.

---

## Bộ mở đầu section (luôn dùng bộ 3 này)

```html
<section id="section-2">
  <p class="section-kicker">02 · Kiến trúc</p>
  <h2 class="section-title">Tiêu đề nói thẳng vào ý chính.</h2>
  <p class="section-intro">1-3 câu dẫn nhập, giải thích vì sao phần này quan trọng.</p>
  ...
</section>
```
`section-kicker` luôn đánh số `01 ·`, `02 ·`... khớp với `nav-number` ở sidebar.

---

## Grid + Card

```html
<div class="grid three">          <!-- .two | .three | .four -->
  <article class="card">
    <div class="icon" aria-hidden="true">🎯</div>
    <span class="badge blue">nhãn</span>       <!-- optional -->
    <h3>Tiêu đề card</h3>
    <p>Nội dung ngắn 1-3 câu.</p>
  </article>
</div>
```

## Badge — 4 biến thể

```html
<span class="badge">mặc định (brand)</span>
<span class="badge orange">cảnh báo nhẹ</span>
<span class="badge red">nguy hiểm</span>
<span class="badge blue">thông tin</span>
```

## Callout — 3 mức

```html
<div class="callout">            <!-- thông tin (brand) -->
  <div aria-hidden="true">💡</div>
  <div>
    <strong>Tiêu đề</strong>
    <p>Nội dung. Có thể dùng <code>inline code</code>.</p>
  </div>
</div>

<div class="callout warning"> ... </div>   <!-- ⚠️ vàng/cam -->
<div class="callout danger">  ... </div>   <!-- 🚫 đỏ -->
```

## Timeline — mốc thời gian / quy trình theo bước

```html
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-dot" aria-hidden="true"></div>
    <div class="timeline-time">08:00</div>
    <div class="timeline-content">
      <h3>Tên bước</h3>
      <p>Mô tả việc xảy ra ở mốc này.</p>
    </div>
  </div>
  <!-- lặp lại timeline-item -->
</div>
```

## Architecture — sơ đồ khối hệ thống

```html
<div class="architecture">
  <div class="arch-node">
    <div class="node-top">
      <span aria-hidden="true">📥</span>
      <span class="badge">input</span>
    </div>
    <h3>Tên khối</h3>
    <p>Khối này làm gì.</p>
  </div>
  <div class="arch-node policy"> ... </div>   <!-- biến thể policy -->
  <div class="arch-node action"> ... </div>   <!-- biến thể action -->
</div>
```

## Precedence — thứ tự ưu tiên, có xếp hạng

```html
<div class="precedence">
  <div class="precedence-row">
    <div class="rank">1</div>
    <div>
      <strong>Mục ưu tiên cao nhất</strong>
      <span>Giải thích ngắn vì sao đứng đầu.</span>
    </div>
  </div>
  <!-- rank 2, 3, 4... -->
</div>
```

## Loop — vòng lặp / chu trình

```html
<div class="loop">
  <div class="loop-step">
    <strong>1. Đọc</strong>
    <span>Thu thập dữ liệu đầu vào.</span>
  </div>
  <div class="loop-step">
    <strong>2. Đánh giá</strong>
    <span>So với baseline.</span>
  </div>
</div>
```

## Metric — số liệu xếp dọc

```html
<div class="metric-stack">
  <div class="metric">
    <strong>1.9 GB</strong>
    <span>Dung lượng giải phóng</span>
  </div>
  <div class="metric">
    <strong>0.82 ms</strong>
    <span>Latency truy vấn</span>
  </div>
</div>
```

## Prompt card — khối code/prompt có nút copy

```html
<div class="prompt-card">
  <div class="prompt-head">
    <div>
      <strong>Tên prompt</strong>
      <span>Dùng khi nào</span>
    </div>
    <button class="copy-button" type="button" data-copy="prompt-1">📋 Copy</button>
  </div>
  <pre id="prompt-1">Nội dung prompt hoặc code ở đây.
Xuống dòng giữ nguyên.</pre>
</div>
```
⚠️ `data-copy` phải khớp `id` của `<pre>`. JS sẵn có sẽ tự bắt sự kiện + hiện toast.

Nhấn từ khoá trong prompt: `<span class="token">--flag</span>`

## Danh sách

```html
<ul class="check-list">        <!-- có dấu ✓ -->
  <li>Việc đã hoàn thành</li>
</ul>

<ul class="plain-list">        <!-- có bullet tròn -->
  <li>Mục thường</li>
</ul>
```

## FAQ / nội dung gấp gọn

```html
<details>
  <summary>Câu hỏi hoặc tiêu đề gấp gọn?</summary>
  <div>Nội dung trả lời, hiện ra khi click.</div>
</details>
```

## Bảng — CHỈ dùng khi thật sự cần

```html
<div class="table-wrap">
  <table>
    <thead><tr><th>Cột 1</th><th>Cột 2</th></tr></thead>
    <tbody><tr><td>...</td><td>...</td></tr></tbody>
  </table>
</div>
```
⚠️ **Bảng rất khó đọc trên điện thoại → ưu tiên `card` / `metric` / `precedence` thay cho bảng.** Chỉ dùng bảng khi dữ liệu thực sự dạng ma trận nhiều cột và không diễn đạt cách khác được. Luôn bọc `.table-wrap` để scroll ngang trên mobile.

## Source box — ghi nguồn cuối tài liệu

```html
<div class="source-box">
  <strong>Nguồn dữ liệu</strong><br />
  Liệt kê nguồn, thời điểm truy vấn, phạm vi.
</div>
```

## Footer

```html
<footer class="footer">
  <strong>Tên tài liệu</strong><br />
  Ghi chú · Ngày cập nhật
</footer>
```
