# Auto-Discovery System

> **Note:** With the PR-driven submission process (see `data/listings.md`), auto-discovery
> may be unnecessary. Projects submit themselves via PR, which provides human review
> and avoids the complexity of automated crawling. This design is preserved for future
> consideration if organic growth proves insufficient.

## Overview

Automatically find spite projects by searching for repos with `.spite` or `SPITE.md` files.

## Architecture (Cloud Run Compatible)

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Scheduler                       │
│              (triggers daily at 3am UTC)                 │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP POST /api/discover/trigger
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Discovery Worker                        │
│                  (Cloud Run Job)                         │
│                                                          │
│  1. Query search APIs for spite files                    │
│  2. Filter against blocklist                             │
│  3. Fetch & validate metadata                            │
│  4. Queue for review or auto-approve                     │
└─────────────────────────────────────────────────────────┘
```

## Search Sources

### GitHub Code Search (Primary)
```
GET https://api.github.com/search/code?q=filename:.spite+OR+filename:SPITE.md
```
- Rate limit: 10 requests/minute unauthenticated, 30/minute with token
- Returns file matches, extract repo owner/name

### GitLab Search
```
GET https://gitlab.com/api/v4/search?scope=blobs&search=filename:.spite
```
- Rate limit: 10 requests/second unauthenticated

### Sourcegraph (Future)
```
GET https://sourcegraph.com/.api/search/stream?q=file:^\.spite$+OR+file:^SPITE\.md$
```
- Searches across multiple forges

## Discovery Flow

```python
# Pseudocode
def discover():
    candidates = []

    # Search each source
    for source in [github_search, gitlab_search]:
        results = source.search_for_spite_files()
        candidates.extend(results)

    # Dedupe by repo URL
    candidates = dedupe(candidates)

    # Filter blocklist
    candidates = [c for c in candidates if not is_blocked(c.repo_url)]

    # Filter already-known
    candidates = [c for c in candidates if not already_indexed(c.repo_url)]

    # Fetch and validate metadata
    for candidate in candidates:
        try:
            metadata = fetch_spite_file(candidate)
            validate(metadata)
            queue_for_review(candidate, metadata)
        except:
            log_invalid(candidate)

    return len(candidates)
```

## Cloud Run Job Setup

```yaml
# cloudbuild-discover.yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'jobs'
      - 'execute'
      - 'spiteprojects-discover'
      - '--region=us-central1'

# Create the job:
# gcloud run jobs create spiteprojects-discover \
#   --image=us-central1-docker.pkg.dev/secret-weapon-group/cloud-run-source-deploy/spiteprojects:latest \
#   --command="node" \
#   --args="src/jobs/discover.js" \
#   --region=us-central1

# Schedule it:
# gcloud scheduler jobs create http spiteprojects-discover-daily \
#   --schedule="0 3 * * *" \
#   --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/secret-weapon-group/jobs/spiteprojects-discover:run" \
#   --http-method=POST \
#   --oauth-service-account-email=website@secret-weapon-group.iam.gserviceaccount.com
```

## Review Queue

Discovered projects go into a review queue:
- **Auto-approve** if:
  - Valid metadata
  - Not on blocklist
  - Has 10+ stars (some social proof)
  - No suspicious URLs

- **Manual review** if:
  - New/unknown author
  - Low star count
  - External URLs to unknown domains

## API Endpoints

```
POST /api/discover/trigger     # Manually trigger discovery (admin)
GET  /api/discover/queue       # View pending reviews (admin)
POST /api/discover/approve/:id # Approve a candidate (admin)
POST /api/discover/reject/:id  # Reject a candidate (admin)
```

## Rate Limiting Strategy

To stay within API limits:
1. Run discovery once daily
2. Cache search results for 24h
3. Spread metadata fetches over time
4. Use GitHub token for higher limits (set GH_TOKEN env var)

## Environment Variables

```
GH_TOKEN=ghp_xxx           # GitHub personal access token (optional, increases rate limits)
GITLAB_TOKEN=glpat-xxx     # GitLab token (optional)
DISCOVERY_AUTO_APPROVE=0   # Set to 1 to auto-approve all valid projects
```
