# Component catalog

Markup của từng component. CSS đã có sẵn trong `template.html` — chỉ cần copy markup vào.

> ⚠️ **Số lượng con phải khớp CSS.** Vài component là CSS Grid với số cột cố định
> (`precedence-row`, `timeline-item`, `metric`, `callout`). Thêm/bớt/bọc thêm `<div>` là
> layout lệch ngay. Mỗi component dưới đây ghi rõ **số con trực tiếp** bắt buộc.

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
Số cột **cố định** theo class: `.two` = 2, `.three` = 3, `.four` = 4. Đặt đúng số card cho
khớp, thiếu card thì hàng bị hụt (ví dụ 2 card trong `.grid.three` → trống 1 ô).

## Badge — 4 biến thể

```html
<span class="badge">mặc định (brand)</span>
<span class="badge orange">cảnh báo nhẹ</span>
<span class="badge red">nguy hiểm</span>
<span class="badge blue">thông tin</span>
```

## Callout — 3 mức

**2 con trực tiếp:** ô icon, rồi ô nội dung.

```html
<div class="callout">            <!-- thông tin (brand) -->
  <div aria-hidden="true">💡</div>
  <div>
    <strong>Tiêu đề</strong>
    <p>Nội dung. Có thể dùng <code>inline code</code> và <strong>nhấn mạnh</strong>.</p>
  </div>
</div>

<div class="callout warning"> ... </div>   <!-- ⚠️ vàng/cam -->
<div class="callout danger">  ... </div>   <!-- 🚫 đỏ -->
```
`.callout strong` là `display: block` để làm **tiêu đề** callout. `<strong>` nhấn mạnh nằm
trong `<p>`/`<li>` đã được template trả lại `inline`, nên dùng thoải mái.

## Timeline — mốc thời gian / quy trình theo bước

**3 con trực tiếp mỗi item:** dot, time, content.

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

Grid `auto-fit`, mỗi khối tối thiểu 138px → **số khối bao nhiêu cũng đầy hàng**, tự xuống
dòng khi hết chỗ. Đẹp nhất là 3-5 khối.

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

**3 con TRỰC TIẾP mỗi row:** `.rank`, `<strong>`, `<span>` — grid là `42px 190px 1fr`.
**Không bọc `strong` + `span` vào một `<div>`**, làm vậy cột `1fr` bỏ trống và chữ bị nén
vào 190px.

```html
<div class="precedence">
  <div class="precedence-row">
    <div class="rank">1</div>
    <strong>Mục ưu tiên cao nhất</strong>
    <span>Giải thích ngắn vì sao đứng đầu.</span>
  </div>
  <!-- rank 2, 3, 4... -->
</div>
```

## Loop — vòng lặp / chu trình

Grid `auto-fit`, mỗi step tối thiểu 150px → số step nào cũng đầy hàng. **2 con** mỗi step.

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

**2 con trực tiếp** mỗi metric — grid `140px 1fr`: số bên trái, nhãn bên phải.

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

## Hero stat — số liệu nổi bật trên hero

Grid `auto-fit`, tối thiểu 150px → 2-4 cái đều đầy hàng.
**2 con** mỗi stat.

```html
<div class="hero-stats" aria-label="Số liệu chính">
  <div class="hero-stat">
    <strong>34,9s</strong>
    <span>Nhãn mô tả số này</span>
  </div>
  <!-- 2-4 cái là đẹp nhất -->
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
Bảng chỉ thật sự hợp khi dữ liệu dạng ma trận nhiều cột. Ít cột thì `card` / `metric` / `precedence` đọc dễ hơn hẳn. Luôn bọc `.table-wrap` để bảng rộng hơn khung thì scroll ngang được.

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

---

## Bảng tra nhanh: số con trực tiếp bắt buộc

- `.callout` → **2** (ô icon, ô nội dung)
- `.timeline-item` → **3** (`.timeline-dot`, `.timeline-time`, `.timeline-content`)
- `.precedence-row` → **3** (`.rank`, `<strong>`, `<span>`)
- `.metric` → **2** (`<strong>`, `<span>`)
- `.hero-stat` → **2** (`<strong>`, `<span>`)
- `.loop-step` → **2** (`<strong>`, `<span>`)
- `.arch-node` → tự do (`.node-top`, `h3`, `p`)
- `.card` → tự do (`.icon`, `.badge`, `h3`, `p`)

Số cột của container:
- **Cố định** (phải đặt đúng số phần tử): `.grid.two` = 2 · `.grid.three` = 3 · `.grid.four` = 4
- **auto-fit** (bao nhiêu cũng đầy hàng): `.hero-stats` · `.architecture` · `.loop`
