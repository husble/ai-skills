---
name: git-commit-message
description: Generate standardized commit messages or PR title using Conventional Commits
---

## What I do

* Analyze code changes (diff, files, summary)
* Identify the primary intent of the change
* Generate a concise, standardized commit message
* Ensure compliance with Conventional Commits

## When to use me

Use this when creating a commit message or PR title for code changes.
Ask clarifying questions if the intent of the changes is unclear.

## Rules

### Format

```
<type>(optional scope): <description>
```

### Allowed types

* feat → new feature (user-visible)
* fix → bug fix
* refactor → no behavior change
* docs → documentation only
* style → formatting only
* test → test changes
* chore → config, dependencies, CI/CD

### Description

* Maximum 50 characters
* Use present tense (add, fix, update…)
* Lowercase only
* No period at the end
* Must be specific (avoid vague wording)

### Scope

* Optional but recommended
* Derived from module, folder, or domain
* Examples: auth, api, ui, payment, core, config

### Type selection

* New functionality → feat
* Bug fix → fix
* Refactor only → refactor
* Docs only → docs
* Formatting only → style
* Tests only → test
* Otherwise → chore

### Breaking change

Use `!` if not backward compatible:

```
feat!: change API response format
```

## Constraints

* Output ONLY one commit message
* No explanation
* No multiple options
* No extra formatting

## Examples

Input: add login API with JWT
Output:

```
feat(auth): add JWT login API
```

Input: fix null token crash
Output:

```
fix(auth): handle null token crash
```

Input: format code with prettier
Output:

```
style: format code with prettier
```
