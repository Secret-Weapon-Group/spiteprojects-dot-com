# Spite Builders ✊

Developers who build things out of spite. They probably don't need your job, but you can try.

## Format

Each builder is a YAML block in a code fence. Required fields marked with `*`.

```yaml
- name: Display Name *
  linkedin: https://linkedin.com/in/username
  github: https://github.com/username *
  projects: [project-names-from-listings]  # links to their spite projects
  title: Professional Spite Engineer  # their snarky title *
  available: true/false  # currently entertaining offers *
  spite_specialty: Replacing $500k enterprise tools with bash scripts *
```

**Rules:**
- `name`, `github`, `title`, `available`, and `spite_specialty` are required
- `github` must be a valid GitHub profile URL
- `linkedin` is optional but recommended
- `projects` should reference project names from listings.md
- `title` should be snarky and spite-themed (max 100 characters)
- `spite_specialty` should describe what they excel at building out of spite (max 200 characters)
- Keep entries alphabetically sorted by `name`

---

## Builders

```yaml
- name: Adam Sah
  linkedin: https://linkedin.com/in/adamsah
  github: https://github.com/asah
  projects: [spiteprojects.com]
  title: Chief Spite Officer
  available: false
  spite_specialty: Building directories of things built out of spite
```
