# Vanity URL Routing

Vanity URLs provide short, memorable paths to spite projects. Built with spite against complicated routing systems.

## How It Works

### Path-based Vanity URLs (Current)

Projects can claim a vanity slug for simple redirects:

```
spiteprojects.com/myapp → https://myapp.com
```

**Implementation:**
1. Add `vanity: myapp` to project metadata in `data/listings.md`
2. Server middleware checks incoming paths against vanity slugs
3. If match found and project has `web` URL, returns 302 redirect
4. Shows brief "Redirecting with Spite ✊" splash page

**Example:**
```yaml
- name: My Spite App
  author: username
  web: https://myspiteapp.com
  vanity: myapp
```

Access at: `https://spiteprojects.com/myapp`

### Subdomain Routing (Future)

Wildcard DNS will enable subdomain routing for trusted projects:

```
myapp.spiteprojects.com → https://myapp.com
```

**Requirements:**
- Project must have `vanity` field
- Project must have `trusted: true` (manual approval required)
- Wildcard DNS: `*.spiteprojects.com → server IP`

**Example:**
```yaml
- name: My Spite App
  author: username
  web: https://myspiteapp.com
  vanity: myapp
  trusted: true
```

Access at: `https://myapp.spiteprojects.com`

## Trust Levels

Projects graduate through trust levels based on quality and community standing:

| Level | Description | URL Access |
|-------|-------------|------------|
| **Listed** | Default for all accepted projects | `spiteprojects.com` listing page |
| **Vanity** | Short path redirect | `spiteprojects.com/myapp` |
| **Subdomain** | Trusted subdomain (requires `trusted: true`) | `myapp.spiteprojects.com` |
| **Hosted** | Future: static site hosting | `myapp.spiteprojects.com` (hosted) |

### Getting Trusted Status

Projects can request `trusted: true` status via PR if they meet criteria:
- Active maintenance (commits in last 90 days)
- Community engagement (usage, stars, contributions)
- No spam, malware, or malicious redirects
- Aligns with spite ethos (anti-enterprise, vibe-coding, etc.)

Manual approval required to prevent abuse ✊

## Validation Rules

1. **Vanity slug requirements:**
   - Lowercase alphanumeric and hyphens only
   - 3-20 characters
   - Must be unique across all projects
   - Cannot conflict with reserved paths: `api`, `health`, `assets`, etc.

2. **Redirect requirements:**
   - Project must have `web` URL defined
   - Redirect URL must be HTTPS
   - No redirect chains (must point to final destination)

3. **Trusted subdomain requirements:**
   - All vanity requirements plus:
   - `trusted: true` in metadata
   - Manual approval from maintainer
   - SSL certificate configured

## Reserved Slugs

The following slugs are reserved and cannot be used as vanity URLs:
- `api`
- `health`
- `assets`
- `static`
- `admin`
- `www`
- `blog`
- `docs`

## Future: Static Site Hosting

Eventually, trusted projects can opt into free static site hosting:

```yaml
vanity: myapp
trusted: true
hosting:
  enabled: true
  source: ./public
```

Build with spite against expensive hosting platforms ✊

## Technical Implementation

### Current (Path-based)

```javascript
// Middleware in src/server.js
app.use((req, res, next) => {
  const vanitySlug = req.path.slice(1).split('/')[0];
  const project = listings.find(p => p.vanity === vanitySlug);

  if (project && project.web) {
    return res.redirect(302, project.web);
  }

  next();
});
```

### Future (Subdomain)

```javascript
// Check subdomain
const subdomain = req.hostname.split('.')[0];
const project = listings.find(p =>
  p.vanity === subdomain && p.trusted === true
);

if (project && project.web) {
  return res.redirect(302, project.web);
}
```

## Why This Approach?

- **Simple:** No complex routing logic or databases
- **Fast:** In-memory lookup from flat file
- **Transparent:** Everything in version control
- **Community-driven:** Changes via PR, not admin panel
- **Spite-powered:** Built because URL shorteners want $99/month ✊
