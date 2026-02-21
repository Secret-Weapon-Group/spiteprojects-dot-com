[spiteprojects.com](spiteprojects.com)

AI projects built out of spite, including this project itself (hence the snarky -dot-com).

Commit to main, it goes live.


# Features

## Spite Score™ System ✊

Every project gets assigned a **Spite Score** (1-10) by Claude, measuring how spiteful it truly is.

The maintainer runs `npm run generate-scores` locally to have Claude evaluate projects based on:
- Spitefulness of purpose (built to prove someone wrong?)
- Simplicity over complexity (replaced bloatware with elegant code?)
- Evident rage (can you feel the anger?)
- Weekend project vibes (48 hours of caffeine-fueled spite?)

Each score comes with a snarky AI-generated roast. Submitters can't set their own scores - objectivity requires external evaluation.

See [DESIGN-SPITE-SCORE.md](DESIGN-SPITE-SCORE.md) for the full scoring rubric and workflow.

## Badges System ✊

Projects can earn badges for their unique spite characteristics. See [DESIGN-BADGES.md](DESIGN-BADGES.md) for all available badges:

- 🏃 Speed Run - First commit to production < 24 hours
- ☕ One Coffee Build - Built during a single coffee session
- 💢 Rage Quit Result - Built immediately after rage-quitting something
- 🌙 3am Spite - Primary commits between 2-5am
- 🔄 Full Circle - Replaced something that replaced something you built
- 🎯 Surgical Strike - Under 100 lines of code
- 🦣 Mammoth Slayer - Replaced enterprise software
- 🎨 Vibe Coded - Built primarily with AI assistance
- 💸 Subscription Killer - Replaces a paid SaaS
- 🏴 First Blood - One of the first 100 spite projects listed

## Passive-Aggressive Changelog Generator

Turn boring commit messages into snarky changelog entries:

```bash
npm run generate-changelog https://github.com/user/repo
```

Example output:
- "Fix bug" → "Fixed the bug that 'wasn't a priority' last sprint"
- "Add feature X" → "Added the feature that definitely needed a 6-person committee to approve"
- "Update deps" → "Updated dependencies because apparently that's a full-time job now"

Set `GITHUB_TOKEN` environment variable to avoid rate limits.

# FAQ

## why hosted on .com and not .ai ?

Part of the spite is people trying to commercialize things that are an afternoon of vibe coding.

## how do i join ?

Submit a non-bullshit PR. See [DESIGN-METADATA.md](DESIGN-METADATA.md) for the format.

## how do I report bugs and feature requests ?

Submit an [issue](https://github.com/Secret-Weapon-Group/spiteprojects-dot-com/issues)

## what's secret weapon ?

It's a secret.  Sometimes we help.

