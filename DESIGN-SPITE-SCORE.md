# Spite Score™ Design ✊

The **Spite Score™** (SS™) is a maintainer-assigned rating (1-10) that quantifies how spiteful a project truly is, accompanied by a snarky AI-generated roast.

## Why It Exists

Because not all spite is created equal. Some projects are mild frustration dressed up as rebellion. Others are pure, concentrated weekend warrior rage against the machine. The Spite Score™ separates the posers from the legends.

## The Workflow

1. **Submitter creates PR**: Project authors submit their projects to `data/listings.md` with standard metadata (name, description, repo, etc.)
2. **Maintainer reviews**: If approved, the PR is merged
3. **Maintainer runs locally**: The maintainer runs `npm run generate-scores` on their machine
4. **Claude evaluates**: The script calls Claude API to generate `spite_score` and `spite_roast` for any projects missing scores
5. **Maintainer commits**: The updated `data/listings.md` with scores is committed and pushed

### Why This Workflow?

**Submitters can't control their own score.** This is intentional. If people could set their own Spite Score™, every project would claim to be a 10/10 weekend rage masterpiece. Instead:

- The maintainer runs the generator with their own API key (not committed to repo)
- Claude evaluates each project objectively based on the criteria
- Scores are assigned consistently across all projects
- The snark is real, unfiltered, and hilarious

**Security note**: The API key never touches the repo. It's passed via environment variable on the maintainer's machine only.

## The Scoring Prompt

When evaluating projects, Claude uses this prompt:

```
You are the Spite Score™ evaluator for spiteprojects.com - a directory of AI projects built out of spite, rage, and weekend warrior energy.

Your job is to assign a Spite Score (1-10, one decimal place) and write a snarky 1-2 sentence roast.

Evaluate based on:
- **Spitefulness of purpose**: Did they build this to prove someone wrong? To replace something that pissed them off?
- **Simplicity over complexity**: Did they replace an expensive/bloated solution with something beautifully simple?
- **Evident rage**: Can you feel the "screw this, I'll do it myself" energy in the description?
- **Weekend project vibes**: Does this scream "I built this in 48 hours fueled by caffeine and spite"?

Scoring guide:
- 1-3: Barely spite, more like mild annoyance
- 4-6: Respectable spite, clear anti-establishment energy
- 7-8: Pure concentrated spite, weekend warrior excellence
- 9-10: Legendary spite, the stuff of folklore

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"spite_score": 7.5, "spite_roast": "Your snarky roast here."}

Project to evaluate:
Name: {name}
Author: {author}
Description: {description}
```

## Scoring Criteria Breakdown

### Spitefulness of Purpose (25%)
- Did they build this because someone told them it was impossible?
- Is this revenge against a product/company/person?
- Does the description mention proving someone wrong?

### Simplicity over Complexity (25%)
- Did they replace a bloated enterprise solution with 200 lines of code?
- Is there a "this could have been an email" vibe?
- Bonus points for "weekend project" that replaces a $10M SaaS

### Evident Rage (25%)
- Can you feel the anger in the description?
- Do they call out specific pain points?
- Is there profanity or barely-contained fury?

### Weekend Project Vibes (25%)
- Does this feel like it was built in 48 hours?
- Is there a scrappy, "held together with duct tape" energy?
- Would you believe they did this fueled by spite and coffee?

## Example Scores

### 9.5/10 - Legendary Spite
*"Built a complete email marketing platform in a weekend because MailChimp charged me $300/month for a list of 12 people."*

**Roast**: "This is what happens when you push a developer too far - they burn down your entire business model in 48 hours."

### 7.0/10 - Pure Concentrated Spite
*"Fed up with bloated project management tools, so I made one that fits in a single HTML file."*

**Roast**: "Turns out the emperor has no clothes, and this dev just proved it with 500 lines of JavaScript."

### 4.5/10 - Respectable Spite
*"Automated my job application process because manually filling forms is tedious."*

**Roast**: "Mildly inconvenienced developer automates mildly inconvenient task. Revolutionary."

### 2.0/10 - Barely Spite
*"Made a todo app with AI because I wanted to learn React."*

**Roast**: "Sir, this is a tutorial, not a spite project."

## Future Plans

The current workflow requires the maintainer to run the script locally, which is fine for a small directory but won't scale.

**Future option**: Run the generator on a cheap micro Linux instance (e.g., AWS t4g.nano, $3/month):
- Set up a cron job or GitHub Action that triggers on new merges
- Store API key as a secret on the instance
- Automatically generate scores for new projects
- Create a commit with the updated scores
- Push back to the repo

For now, we're keeping it simple and manual. Because that's the spite way. ✊

## Usage

```bash
# Set your Anthropic API key (get one at console.anthropic.com)
export ANTHROPIC_API_KEY=sk-ant-...

# Generate scores for any projects missing them
npm run generate-scores

# The script will:
# - Read data/listings.md
# - Find projects without spite_score
# - Call Claude API to evaluate each one
# - Update the file in-place with scores and roasts
# - Print results to console

# Commit and push when you're happy with the results
git add data/listings.md
git commit -m "Add Spite Scores for new projects"
git push
```

## Technical Details

- **Model**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Token limit**: 200 tokens per generation (enough for score + roast)
- **Rate limiting**: 1 second delay between API calls to be nice
- **Error handling**: Aborts on first error to avoid partial updates
- **Idempotency**: Safe to run multiple times - skips projects that already have scores

## Metadata Fields

Projects in `data/listings.md` can now include:

```yaml
- name: My Spite Project
  author: username
  description: Built this because...
  repo: https://github.com/user/repo
  spite_score: 7.5           # Generated by maintainer, not submitter-controlled
  spite_roast: Snarky roast. # LLM-generated commentary
```

See `DESIGN-METADATA.md` for full metadata schema.

---

**Remember**: The Spite Score™ is not a measure of code quality, popularity, or usefulness. It's a measure of pure, unfiltered spite. Wear your low score with shame. Wear your high score with pride. ✊
