# Security Considerations

## Threat Model

SpiteProjects links to external resources. Key risks:

1. **Malicious Links** - Projects linking to malware, phishing, or scam sites
2. **XSS via Metadata** - Malicious content in project descriptions
3. **Reputation Abuse** - Legitimate-looking projects that turn malicious
4. **Spam/SEO Abuse** - Using the directory for link farming

## Mitigations

### 1. Link Safety

#### Blocklist System
See `blocklist.md` for blocked domains/patterns.

#### External Link Warnings
All external links:
- Open in new tab with `rel="noopener noreferrer"`
- Show domain clearly in UI
- Consider interstitial: "You are leaving SpiteProjects..."

#### Link Scanning (Future)
Integrate with:
- Google Safe Browsing API
- VirusTotal URL scanner
- Manual reporting system

#### App Store Links
Only allow official app store domains:
- `play.google.com`
- `apps.apple.com`
- `f-droid.org`

### 2. Content Safety

#### Input Sanitization
- Strip HTML from all user-provided text
- Escape special characters before rendering
- Limit field lengths (description: 500 chars)

#### CSP Headers
```
Content-Security-Policy:
  default-src 'self';
  img-src 'self' https:;
  script-src 'self';
  style-src 'self' 'unsafe-inline';
```

#### Thumbnail Handling
- Proxy external images through our server (future)
- Or: only allow relative paths to repo
- Validate image URLs are HTTPS
- Block known malicious image hosts

### 3. Reputation Monitoring

#### Git Activity Signals
Suspicious patterns:
- Repo created same day as submission
- No commits except initial
- Only metadata files, no actual code
- Fork of popular project with only metadata changes

#### Manual Review Triggers
Auto-flag for review if:
- New author (first submission)
- Links to unknown domains
- Description contains URLs
- Multiple submissions in short time

### 4. Abuse Prevention

#### Rate Limiting
- Submit: 5 projects per IP per day
- API: 100 requests per IP per minute

#### CAPTCHA (Future)
Add for submission form if spam becomes issue.

#### Report Button
Allow users to report suspicious projects:
```
POST /api/report
{
  project_id: "...",
  reason: "malware|spam|inappropriate|other",
  details: "..."
}
```

### 5. Admin Tools

#### Quick Actions
- One-click block (adds to blocklist)
- Remove + block author
- Bulk review queue

#### Audit Log
Track all admin actions:
- Who approved/rejected what
- When blocklist was modified
- Manual overrides

## Incident Response

### If Malicious Link Discovered

1. Immediately add to blocklist
2. Remove project from listing
3. Check for other projects by same author
4. If widespread: take site offline temporarily

### If Site Compromised

1. Revoke all service account keys
2. Rotate secrets
3. Check deployment logs
4. Restore from known-good state

## Security Headers

```javascript
// Add to Express app
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

## Data Privacy

- Don't log IP addresses long-term
- Don't track users
- No cookies except essential session (if needed)
- See PRIVACY.md for user-facing policy
