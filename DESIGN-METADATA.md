# Spite Project Metadata Format

Projects declare themselves as spite projects by including a `.spite` file or `SPITE.md` in their repo root.

## File Detection Order

1. `.spite` (YAML format)
2. `SPITE.md` (Markdown with YAML frontmatter)
3. `.spite.yaml`
4. `.spite.json`

## .spite Format (YAML)

```yaml
# Required: at least one of repo, web, or app
name: My Spite Project
author: username
description: |
  Built this because someone said it would take 6 months.
  Did it in a weekend.

# Links (at least one required)
repo: https://github.com/user/project  # auto-detected from submission
web: https://myproject.com
app:
  android: https://play.google.com/store/apps/details?id=com.example
  ios: https://apps.apple.com/app/id123456789

# Optional
thumbnail: https://example.com/thumb.png  # or relative: ./assets/spite-thumb.png
labels:
  - weekend-project
  - vibe-coding
  - anti-enterprise

# Optional: override git-derived activity
status: active  # active | maintained | archived | dormant
```

## SPITE.md Format

```markdown
---
name: My Spite Project
author: username
description: Built this because someone said it would take 6 months.
web: https://myproject.com
labels: [weekend-project, vibe-coding]
---

# Why This Exists

Extended description of the spite behind this project...
(This content is displayed on the project detail page)
```

## Auto-Derived Metadata

From git/GitHub API:
- `repo`: The submitted URL
- `date_submitted`: When added to directory
- `last_commit`: Most recent commit date
- `commit_count_30d`: Commits in last 30 days
- `stars`: GitHub stars (if applicable)
- `activity_level`: Computed from commit frequency
  - `hot`: 10+ commits in 30 days
  - `active`: 1-9 commits in 30 days
  - `maintained`: commit in last 90 days
  - `dormant`: no commits in 90+ days

## Validation Rules

1. Must have at least one link: `repo`, `web`, or `app.*`
2. `description` max 500 chars
3. `name` max 100 chars
4. `thumbnail` must be HTTPS or relative path
5. Max 10 labels
6. URLs must be valid and not on blocklist
