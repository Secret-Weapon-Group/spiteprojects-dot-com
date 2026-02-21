# Labels/Categories System

## Why Labels Over Categories

Labels are more flexible than hierarchical categories:
- Projects can have multiple labels
- Easy to add new labels without restructuring
- Users can filter by combining labels
- Matches how spite projects naturally overlap domains

## Label Format

- Lowercase, hyphenated: `weekend-project`, `anti-saas`
- Max 30 characters
- Max 10 labels per project
- Alphanumeric + hyphens only

## Suggested Core Labels

### By Motivation (the spite)
- `anti-enterprise` - Built to avoid enterprise software
- `anti-saas` - Built to avoid SaaS subscriptions
- `anti-complexity` - Simpler alternative to over-engineered solutions
- `weekend-project` - Built in a weekend to prove a point
- `vibe-coding` - AI-assisted rapid development
- `rage-quit` - Built after rage-quitting another tool
- `just-because` - No specific spite, just wanted to

### By Domain
- `dev-tools` - Developer tools
- `web-app` - Web applications
- `cli` - Command-line tools
- `mobile` - Mobile apps
- `automation` - Automation/scripting
- `ai-ml` - AI/ML projects
- `productivity` - Productivity tools
- `creative` - Art, music, creative tools

### By Tech
- `python`
- `javascript`
- `rust`
- `go`
- `typescript`

### By Status
- `production-ready` - Actually usable
- `proof-of-concept` - Demonstrates the point
- `work-in-progress` - Under active development

## Label Governance

### Adding New Labels
For now, labels are free-form. Common labels will emerge organically.

Future consideration: curated label list with descriptions.

### Label Normalization
- Auto-lowercase on submit
- Strip leading/trailing whitespace
- Reject invalid characters
- Suggest similar existing labels (fuzzy match)

## UI Considerations

### Project Cards
Show 3 labels max, "+N more" for overflow

### Filtering
- Click label to filter
- Combine labels with AND (show projects matching all)
- URL reflects filters: `/?labels=weekend-project,python`

### Label Cloud
Sidebar or footer showing popular labels with counts

## Data Model

```javascript
// In project document
{
  labels: ['weekend-project', 'anti-saas', 'python'],
  // ... other fields
}

// Labels index (for fast lookup)
{
  label: 'weekend-project',
  count: 42,
  last_used: '2025-02-20T...'
}
```

## Examples of Spite Projects by Label

### anti-enterprise
- Simple deployment script vs. Kubernetes
- SQLite wrapper vs. enterprise databases
- Bash script vs. Jenkins pipeline

### anti-saas
- Self-hosted alternatives to paid services
- Local-first apps vs. cloud subscriptions
- One-time purchase vs. monthly fee

### weekend-project
- "They said it would take 3 months, did it in 2 days"
- MVP that actually shipped
- Proof that complexity is optional

### vibe-coding
- AI-assisted rapid prototyping
- Claude/GPT-built projects
- Natural language to working code
