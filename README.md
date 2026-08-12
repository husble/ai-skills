# AI Skills

Bộ sưu tập **Skills** dùng chung cho AI Agent (Claude Code / PHÈN DEV).
Mỗi skill là một thư mục trong `skills/`, chứa file `SKILL.md` mô tả cách agent thực hiện một tác vụ cụ thể.

## Cấu trúc

```
skills/
└── <ten-skill>/
    └── SKILL.md      # frontmatter (name, description) + hướng dẫn chi tiết
```

Nếu skill cần script hỗ trợ (Node / Python), đặt luôn trong thư mục skill đó.
**Lưu ý:** thư viện (`node_modules/`, `.venv/`...) KHÔNG được commit — pull code về rồi tự cài để repo nhẹ.

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
