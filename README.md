# AI Skills

Bộ sưu tập **Skills** dùng chung cho các AI coding agent (Claude Code, Codex CLI...).
Mỗi skill là một thư mục chứa file `SKILL.md` mô tả cách agent thực hiện một tác vụ cụ thể — agent chỉ nạp skill khi thực sự cần, nên cài nhiều cũng không nặng context.

Repo mở để ai cũng clone về dùng được. Cứ lấy nguyên bộ hoặc nhặt riêng skill mình cần.

## Cài đặt

### Bước 0 — Clone repo

```bash
git clone https://github.com/husble/ai-skills.git
cd ai-skills
```

### Thư mục skill global

| Agent | macOS / Linux | Windows |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `%USERPROFILE%\.claude\skills\` |
| Codex CLI | `~/.codex/skills/` | `%USERPROFILE%\.codex\skills\` |

Cài vào đây là skill dùng được ở **mọi project**. Nếu chỉ muốn dùng trong 1 project, đặt vào `.claude/skills/` hoặc `.codex/skills/` ngay trong project đó.

### Cách 1 — Copy (đơn giản, bản tĩnh)

**macOS / Linux**

```bash
# Claude Code
mkdir -p ~/.claude/skills
cp -r skills/* ~/.claude/skills/

# Codex CLI
mkdir -p ~/.codex/skills
cp -r skills/* ~/.codex/skills/
```

Chỉ cài 1 skill: đổi `skills/*` thành `skills/git-commit-message`.

**Windows (PowerShell)**

```powershell
# Claude Code
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\skills"
Copy-Item -Recurse -Force .\skills\* "$env:USERPROFILE\.claude\skills\"

# Codex CLI
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\skills"
Copy-Item -Recurse -Force .\skills\* "$env:USERPROFILE\.codex\skills\"
```

### Cách 2 — Symlink (tự cập nhật theo `git pull`)

Trỏ thẳng vào repo, sau này `git pull` là skill tự mới, khỏi copy lại.

**macOS / Linux**

```bash
ln -s "$(pwd)/skills/git-commit-message" ~/.claude/skills/git-commit-message
```

**Windows (PowerShell — chạy với quyền Administrator hoặc bật Developer Mode)**

```powershell
New-Item -ItemType SymbolicLink `
  -Path "$env:USERPROFILE\.claude\skills\git-commit-message" `
  -Target "$PWD\skills\git-commit-message"
```

### Sau khi cài

- **Khởi động lại session** của agent — skill được nạp lúc start, session đang mở sẽ không thấy.
- Skill nào cần thư viện (Node / Python) thì vào thư mục skill đó tự cài: `npm install` hoặc `pip install -r requirements.txt`. Repo cố tình **không** commit `node_modules/`, `.venv/` để giữ cho nhẹ.

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
