# AI Skills

Bộ sưu tập **Skills** dùng chung cho các AI coding agent (Claude Code, Codex CLI...).
Mỗi skill là một thư mục chứa file `SKILL.md` mô tả cách agent thực hiện một tác vụ cụ thể — agent chỉ nạp skill khi thực sự cần, nên cài nhiều cũng không nặng context.

Repo mở để ai cũng tải về dùng được. Cứ lấy nguyên bộ hoặc nhặt riêng skill mình cần.

## Cài đặt

### Bước 1 — Tải code về

Chọn 1 trong 2 cách:

- **Cách dễ (không cần biết lệnh):** mở https://github.com/husble/ai-skills → bấm nút xanh **Code** → **Download ZIP** → giải nén file vừa tải.
- **Cách nhanh (nếu máy đã có git):**
  ```bash
  git clone https://github.com/husble/ai-skills.git
  ```

Sau khi tải xong, bên trong sẽ có thư mục `skills/` — mỗi thư mục con là một skill.

### Bước 2 — Mở thư mục skill của agent

Đây là nơi agent tìm skill. Cài vào đây thì dùng được ở **mọi project**.

**Đường dẫn theo từng agent / hệ điều hành:**

| Agent | macOS / Linux | Windows |
|---|---|---|
| Claude Code | `~/.claude/skills` | `%USERPROFILE%\.claude\skills` |
| Codex CLI | `~/.codex/skills` | `%USERPROFILE%\.codex\skills` |

**Mở thư mục đó bằng giao diện, khỏi gõ lệnh:**

- **macOS:** mở **Finder** → bấm `Cmd + Shift + G` → dán đường dẫn ở bảng trên (ví dụ `~/.claude/skills`) → Enter.
  *Thư mục bắt đầu bằng dấu chấm bị ẩn mặc định — muốn nhìn thấy thì bấm `Cmd + Shift + .`*
- **Windows:** mở **File Explorer** → dán đường dẫn vào thanh địa chỉ trên cùng (ví dụ `%USERPROFILE%\.claude\skills`) → Enter.

Nếu chưa có thư mục `skills` thì tự tạo một thư mục mới, đặt đúng tên `skills`.

### Bước 3 — Copy skill vào

Copy **nguyên thư mục skill** từ `skills/` trong repo vừa tải, paste vào thư mục vừa mở ở Bước 2.

> ⚠️ Copy cả folder (ví dụ nguyên folder `git-commit-message`), **không** chỉ copy riêng file `SKILL.md` bên trong.

Kết quả đúng sẽ trông như này:

```
~/.claude/skills/
└── git-commit-message/
    └── SKILL.md
```

Muốn cài hết thì copy tất cả thư mục con trong `skills/`. Muốn cài lẻ thì chỉ copy folder mình cần.

### Bước 4 — Khởi động lại agent

Tắt Claude Code / Codex rồi mở lại. Skill chỉ được nạp lúc khởi động, session đang mở sẽ không thấy skill mới.

---

### Dành cho bạn nào rành terminal (hoặc nhờ AI tự cài)

Copy nguyên block dưới đây chạy thẳng, hoặc dán cho AI agent bảo nó cài giúp:

**macOS / Linux**

```bash
# Claude Code
mkdir -p ~/.claude/skills && cp -r skills/* ~/.claude/skills/

# Codex CLI
mkdir -p ~/.codex/skills && cp -r skills/* ~/.codex/skills/
```

**Windows (PowerShell)**

```powershell
# Claude Code
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\skills"
Copy-Item -Recurse -Force .\skills\* "$env:USERPROFILE\.claude\skills\"

# Codex CLI
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\skills"
Copy-Item -Recurse -Force .\skills\* "$env:USERPROFILE\.codex\skills\"
```

Cài lẻ 1 skill: đổi `skills/*` thành `skills/git-commit-message`.

### Lưu ý

- Chỉ muốn dùng skill trong 1 project cụ thể (không phải toàn máy): đặt vào `.claude/skills/` hoặc `.codex/skills/` ngay trong thư mục project đó.
- Skill nào cần thư viện (Node / Python) thì vào thư mục skill đó tự cài: `npm install` hoặc `pip install -r requirements.txt`. Repo cố tình **không** kèm sẵn `node_modules/`, `.venv/` để giữ cho nhẹ.

## Cấu trúc

```
skills/
└── <ten-skill>/
    └── SKILL.md      # frontmatter (name, description) + hướng dẫn chi tiết
```

Nếu skill cần script hỗ trợ (Node / Python), đặt luôn trong thư mục skill đó.

## Danh sách Skills

### `git-commit-message`
> Generate standardized commit messages or PR title using Conventional Commits

Phân tích code changes (diff, files, summary), xác định intent chính, rồi sinh ra commit message chuẩn **Conventional Commits** (`<type>(scope): <description>`).
Ràng buộc: description tối đa 50 ký tự, thì hiện tại, lowercase, không dấu chấm cuối. Output đúng 1 message, không giải thích.

## Cách thêm skill mới

1. Tạo thư mục `skills/<ten-skill>/`
2. Viết `SKILL.md` với frontmatter:
   ```yaml
   ---
   name: ten-skill
   description: Mô tả ngắn gọn — dùng để agent quyết định khi nào gọi skill này
   ---
   ```
3. Bổ sung skill đó vào mục **Danh sách Skills** ở trên
4. Commit theo chuẩn Conventional Commits (dùng chính skill `git-commit-message` 🙂)
