---
name: pull-request-review
description: Review Pull Request đã mở trên GitHub và trả về feedback có severity — tóm tắt chức năng, soi bug/edge case/security/performance, đề xuất test case, theo dõi nợ kỹ thuật. Dùng khi user nói "review PR", "review PR #123", "soi PR này", "check PR trước khi merge", "pull-request-review".
---

# pull-request-review

Review một Pull Request **đã tồn tại trên GitHub** rồi trả về feedback có cấu trúc, phân theo severity.

> **Phân biệt với skill `new-pr`:** `new-pr` review code **trước khi tạo** PR mới từ nhánh hiện tại. Skill này review PR **đã mở** trên GitHub (có số PR / URL). Đừng gọi cả hai cho cùng một việc.

## Requirements

- [`gh` CLI](https://cli.github.com/) đã cài và đã chạy `gh auth login`
- Đứng trong repo local tương ứng (để đọc được code xung quanh, không chỉ diff)

## Lấy dữ liệu PR

```bash
gh pr view <số PR|URL> --json number,title,author,body,baseRefName,headRefName,state
gh pr diff <số PR|URL>                       # toàn bộ diff
gh pr diff <số PR|URL> --name-only           # danh sách file thay đổi
gh pr view <số PR|URL> --comments            # xem review cũ (phục vụ re-review)
```

Diff quá lớn → đọc theo từng file, ưu tiên file thay đổi nhiều nhất.

## What I do

* Phân tích metadata PR (title, description, author)
* Review code changes (diff, file thay đổi)
* Xác định intent và scope của thay đổi
* Phát hiện bug, edge case, lỗi logic
* Đánh giá chất lượng code (clean code, anti-pattern, duplication)
* Xét kiến trúc và tính nhất quán với codebase hiện có
* Nêu vấn đề performance và security
* Đề xuất cải thiện / refactor cụ thể
* Đề xuất test case còn thiếu
* Trả output có cấu trúc, phân theo severity

## When to use me

Dùng khi review một PR trước khi merge, để đảm bảo chất lượng, tính đúng đắn và mức độ sẵn sàng lên production.

Hỏi lại user nếu:
* PR description thiếu hoặc không rõ
* Intent / scope của thay đổi mơ hồ
* Thiếu context quan trọng (tech stack, business logic)

## Rules

- Không rewrite toàn bộ code nếu không cần.
- Ưu tiên issue quan trọng, tránh nhận xét chung chung.
- Viết nội dung review bằng tiếng Việt, tuân thủ Output format.
- **KHÔNG tự động post comment lên GitHub.** Review xong thì in ra cho user xem trước. Chỉ chạy `gh pr comment` khi user **yêu cầu rõ ràng** — comment lên PR là hành động công khai, người khác nhận notification ngay và không rút lại được.
- **Re-review khi PR có commit mới**: POST **comment MỚI** (incremental re-review), KHÔNG sửa/PATCH comment review cũ. CHỈ sửa (PATCH) comment cũ khi review TRƯỚC bị SAI và user đã feedback yêu cầu sửa.

## Nguyên tắc kiến trúc cần kiểm (flag khi vi phạm)

- **Tầng vào mỏng — logic nằm ở tầng nghiệp vụ**: entrypoint (API route / controller / handler) chỉ nên nhận request, gọi service, trả response. Mọi xử lý nghiệp vụ — transform/aggregate dữ liệu, build query phức tạp, gọi external API, tính toán, hằng số nghiệp vụ dài — phải tách sang tầng service/data. Khi entrypoint ôm logic đáng kể → flag **[Medium]** kèm đề xuất tách hàm.

## Hiệu chỉnh severity (tránh over-rate)

Severity phản ánh **tác động THỰC**, KHÔNG phải độ nhạy cảm của endpoint. Trước khi gán Medium+, hỏi: "Chuyện gì thực sự xảy ra với user/dữ liệu?" Nếu tác động thực nhỏ → Low, dù endpoint là mutating/admin/liên quan tiền.

- **BẮT BUỘC với mọi issue Medium+: trace logic liên quan, KHÔNG chỉ nhìn diff.** Trước khi chốt severity từ Medium trở lên, phải:
  1. **Trace tới nơi dùng giá trị** — giá trị/kết quả bị nghi sai được tiêu thụ ở đâu, có ai đọc/ghi không.
  2. **Kiểm convention/domain** — key nghiệp vụ (định danh order/entity...), ai gọi endpoint (public vs internal/webhook), auth model, cách các module khác đã xử lý tình huống tương tự.
  3. Chưa đủ chắc → verify bằng grep/đọc file liên quan. Vẫn không chắc → hạ xuống Low kèm ghi chú "cần xác nhận", KHÔNG mặc định Medium.

  Nhiều thứ trông như bug trên diff nhưng đúng chủ đích khi xét cả hệ thống → đọc diff đơn lẻ là chưa đủ cơ sở gán Medium+.

- **Sai status code nhưng truy cập VẪN bị chặn = Low.** Sai role trả 500 thay vì 403 (do exception bị catch chung) → chỉ lệch status code, user **vẫn không truy cập được** → **Low**. Không bump lên Medium chỉ vì route mutating/admin. Chỉ thành Medium+ nếu thực sự **bypass** được — truy cập/ghi được trong khi đáng lẽ bị chặn.

- **"Leak error" phải kiểm cách serialize.** Trả về một Error object qua `JSON.stringify` sẽ ra `{}` (message/stack là non-enumerable) → **không lộ gì đáng kể**. Chỉ lộ khi error là string hoặc plain object chứa nội dung nhạy cảm. Đừng mặc định "trả error ra client = leak".

- **Thiếu null-check auth nhưng có backstop ở tầng trên = Low.** Route quên `if (!auth) return 401` nhưng đã có middleware/filter ép xác thực cho toàn bộ nhóm route đó → chỉ là defense-in-depth, không phải lỗ hổng thực → Low.

- **Return/query sai NHƯNG giá trị không được tiêu thụ = Low (dead/cosmetic).** Trước khi gán Medium cho "query sai field / return sai", PHẢI trace tới **nơi dùng giá trị**: client có đọc response không, hay chỉ optimistic-update rồi refetch? Có strip field trước khi gửi không? Nếu kết quả sai đó **không ai dùng** → Low, không phải bug chức năng.

- **Quy tắc chung**: nếu định gán Medium+ mà lý do là "endpoint quan trọng / mutating / admin / liên quan tiền" thay vì "hậu quả thực xảy ra" → dừng lại, hạ severity theo hậu quả thực.

## Pre-merge gate (BẮT BUỘC trước khi kết luận "sẵn sàng merge")

Ngoài review logic/bảo mật, phải làm thêm 2 kiểm tra sau — đây là phần dễ bị bỏ sót nhất ở PR lớn:

1. **Coverage đủ file**: lấy `git diff --name-only origin/<base>...origin/<head>` rồi đối chiếu với phần đã đọc (nếu chia việc cho nhiều agent thì đối chiếu với phần đã giao). KHÔNG để file nào không được xem — đặc biệt file **top-level / cross-cutting** (layout, middleware, config) rất dễ lọt khỏi các nhóm chia theo thư mục con. Liệt kê file chưa ai đọc rồi tự quét nốt.

2. **Build / import resolution**: mỗi import MỚI phải có file đích **tồn tại trên branch** — verify bằng `git cat-file -e origin/<head>:<path>`. Nếu chạy được thì chạy lệnh typecheck/build của project để bắt lỗi module-not-found và type error. Không được chỉ ghi "cần chạy build" vào test plan rồi bỏ qua — phải tự verify.

> Lý do có gate này: một PR thêm import trỏ tới file chưa được commit → build fail, nhưng review vẫn pass vì (a) file nằm ngoài phạm vi thư mục đang xem, (b) không chạy typecheck và không grep import. Một lệnh build hoặc `git cat-file -e` là bắt được ngay.

## Tech Debt Tracking

Mỗi lần review PR, làm thêm bước theo dõi nợ kỹ thuật.

### Nơi lưu

```
$PR_REVIEW_DEBT_DIR/{owner}-{repo}.json     # thay "/" trong repo path bằng "-"
```

- Mặc định `PR_REVIEW_DEBT_DIR` = `~/.claude/pr-review-tech-debt/`
- Set biến môi trường `PR_REVIEW_DEBT_DIR` để đổi sang chỗ khác

> ⚠️ **Không lưu vào bên trong thư mục skill.** Nợ kỹ thuật là dữ liệu nội bộ của từng repo — để trong thư mục skill thì rất dễ bị commit và công khai nhầm khi skill được chia sẻ hay đồng bộ.

### Trước khi review

1. Xác định repo từ PR URL (ví dụ `acme/payment-api` → file `acme-payment-api.json`)
2. Đọc file tech-debt tương ứng nếu có
3. Trong lúc review diff, check xem PR hiện tại có fix issue cũ nào không
4. Nếu issue đã được fix → cập nhật `"status": "done"`, thêm `"resolved_pr"` và `"resolved_date"`

### Sau khi review

1. Lưu các issue mới (severity **Medium trở lên**) vào file tech-debt của repo
2. Format mỗi entry:

```json
{
  "pr": 1078,
  "date": "2026-06-10",
  "author": "author_login",
  "issues": [
    {
      "severity": "Medium",
      "file": "path/to/file.js",
      "description": "Mô tả ngắn gọn vấn đề",
      "status": "open"
    }
  ]
}
```

3. Khi issue được resolved:

```json
{
  "severity": "Medium",
  "file": "path/to/file.js",
  "description": "Mô tả ngắn gọn vấn đề",
  "status": "done",
  "resolved_pr": 1085,
  "resolved_date": "2026-06-15"
}
```

### Lưu ý

- Chỉ lưu issue severity **Medium trở lên** để tránh file phình to
- Issue severity Low chỉ ghi trong nội dung review, không lưu vào tech-debt
- File tech-debt chưa tồn tại → tạo mới với array rỗng `[]`

## Output format

### 📝 Tóm tắt chức năng (BẮT BUỘC — luôn đặt đầu review)
* Mô tả bằng ngôn ngữ thường (cho người không đọc code): PR này thêm/sửa **chức năng gì**, giải quyết vấn đề gì.
* Nêu **luồng người dùng / nghiệp vụ chính** (vd: Import → Preview → Commit), nguồn dữ liệu, ai dùng được (role).
* Ngắn gọn 3-6 gạch đầu dòng. Đây là phần "feature làm gì", TÁCH BIỆT với 🔍 Overview (thiên về thay đổi kỹ thuật/quy mô).

### 🔍 Overview
* Tổng hợp những thay đổi trong PR này.
* Tập trung vào chức năng, logic của những thay đổi.

### 🔍 Files change
* Danh sách các file thay đổi, tóm tắt nhanh về thay đổi trong file
- example.js: tạo dữ liệu mẫu mới

### 🔆 Code quality
* Đánh giá về Clean code, naming, anti-pattern, duplication.
✅ Điểm làm tốt:
  - Những phần làm tốt, cải thiện rõ ràng.
⚠️ Điểm cần lưu ý:
  - Các vấn đề cần lưu ý, tối ưu thêm

### ⚠️ Issues
* Bao gồm: bug tiềm ẩn, null/edge case, performance, security, clean code, sai logic.
1. [High/Medium/Low] File (line number)
  - ❗ Mô tả vấn đề, lý do, trích nguyên văn đoạn code đang có vấn đề
  - 💡 Đề xuất cải thiện cụ thể

### 🧪 Test case
* Đề xuất các test case cần phải thực hiện.

### 📋 Tech Debt
* Hiển thị nếu có issue cũ được resolved hoặc issue mới được ghi nhận.
✅ Resolved (từ nợ cũ):
  - [PR #xxx] Mô tả issue đã fix
📝 Ghi nhận mới:
  - [Medium] file — mô tả vấn đề
