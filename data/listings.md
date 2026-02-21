# Spite Projects Listings

Submit your project by adding an entry below and opening a PR.

## Format

Each project is a YAML block in a code fence. Required fields marked with `*`.

```yaml
- name: Project Name *
  author: your-username *
  description: Short description of the project and its spite *
  repo: https://github.com/user/repo *
  web: https://project-website.com
  app:
    android: https://play.google.com/store/apps/details?id=...
    ios: https://apps.apple.com/app/id...
  thumbnail: https://example.com/image.png
  labels: [label1, label2, label3]
  badges: [speed-run, rage-quit, subscription-killer]  # See DESIGN-BADGES.md
  spite_score: 7.5  # Maintainer-generated, not submitter-controlled
  spite_roast: Snarky AI-generated roast about your spite level
```

**Rules:**
- `repo` is required (must be publicly accessible)
- At least one of: `repo`, `web`, or `app` links
- `description` max 500 characters
- `labels` max 10, lowercase-hyphenated (e.g., `weekend-project`)
- `badges` max 5, see [DESIGN-BADGES.md](../DESIGN-BADGES.md) for valid badge IDs
- Keep entries alphabetically sorted by `name`

---

## Listings

```yaml
- name: spiteprojects.com
  author: asah
  description: This very site - built out of spite against commercialization of simple vibe coding
  repo: https://github.com/Secret-Weapon-Group/spiteprojects-dot-com
  web: https://spiteprojects.com
  vanity: spiteprojects
  labels: [vibe-coding, anti-saas, meta]
```
