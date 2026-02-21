# API Design - Spite Projects

## Overview

The Spite Projects API provides programmatic access to spite project data, spite scores, builder profiles, and platform statistics. Built with spite against over-engineered APIs and unnecessary complexity.

## Design Principles

### 1. RESTful with Spite

- **Predictable URLs**: `/api/v1/projects`, `/api/v1/projects/:name`, etc.
- **Proper HTTP methods**: GET for everything (it's read-only data)
- **Proper status codes**: 200, 404, 429 - no creative status codes for the sake of it
- **JSON everywhere**: No XML, no YAML, no custom formats

### 2. Consistent Response Schema

All successful responses wrap data in a consistent structure:

```json
{
  "data": { ... },
  "meta": { ... }  // Optional: pagination info, counts, etc.
}
```

Error responses:

```json
{
  "error": "Short error type",
  "message": "Human-readable explanation with spite",
  ...additional context...
}
```

### 3. Developer-Friendly

- **No API keys required** (for now) - it's public data
- **CORS enabled** - use it from anywhere
- **Rate limiting headers** - know your limits before hitting them
- **Clear error messages** - with personality
- **Comprehensive docs** - at `/api.html`

### 4. Spiteful Philosophy

- **Free and open**: No paywalls, no "contact sales", no BS
- **Simple**: No pagination tokens, no HATEOAS complexity
- **Honest**: Rate limits exist. Deal with it or self-host.
- **Zero meetings**: The API is the contract. No "onboarding calls."

## Rate Limiting Strategy

### Current Implementation

- **100 requests/minute per IP address**
- Rolling window (not fixed intervals)
- In-memory store (resets on server restart - deal with it)
- Three response headers:
  - `X-RateLimit-Limit`: Max requests per window
  - `X-RateLimit-Remaining`: Requests left in current window
  - `X-RateLimit-Reset`: ISO 8601 timestamp when limit resets

### 429 Response

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Slow down there, champ. Free tier is 100 req/min.",
  "limit": 100,
  "remaining": 0,
  "reset": "2026-02-20T12:34:56.789Z"
}
```

### Future Considerations

**Higher rate limits?**
- Option 1: Self-host. The code is open source.
- Option 2: API keys with tiered limits (if demand warrants it)
- Option 3: Donate to infrastructure costs (future, maybe)

**Rate limit bypass?**
- No. Either self-host or respect the limits.
- This is not enterprise software. We're not doing "custom plans."

## API Versioning

### Current: v1

- URL-based versioning: `/api/v1/...`
- No breaking changes to v1 once stable
- New fields may be added (additive changes)
- Deprecated fields will remain for backwards compatibility

### Future versions

- If breaking changes are needed: `/api/v2/...`
- v1 will remain available indefinitely (or until servers die)
- No planned v2 - spite projects don't change that fast

## CORS Policy

```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Why `*`? Because it's public data. No need for origin whitelisting complexity.

## Security Considerations

### What we do

- Rate limiting (prevent abuse)
- Input validation (prevent injection)
- Standard security headers
- No sensitive data exposure

### What we don't do

- OAuth/JWT (it's public data)
- Request signing (unnecessary complexity)
- IP whitelisting (defeats the purpose)
- DDoS protection beyond basic rate limiting (Cloudflare handles that)

## Future Enhancements

### Maybe Someday

**API Keys & Authentication**
- Optional API keys for higher rate limits
- Simple bearer token auth: `Authorization: Bearer YOUR_API_KEY`
- Self-service key generation (no sales calls)

**Webhooks**
- Subscribe to new projects
- Spite score updates
- New builder submissions
- Simple HTTP POST to your endpoint

**GraphQL Endpoint**
- Maybe. If someone actually needs it.
- Would coexist with REST, not replace it
- `/api/v1/graphql` - single endpoint

**Caching Headers**
- `Cache-Control`, `ETag` support
- Data doesn't change that often anyway

**Streaming**
- Server-Sent Events for real-time updates
- Only if there's actual demand

### Definitely Not

- SOAP
- XML responses
- Custom binary protocols
- Blockchain integration (seriously?)
- "Enterprise features" that require meetings

## MCP Integration (Model Context Protocol)

### Purpose

Allow AI assistants (Claude, ChatGPT, etc.) to access spite project data directly through the Model Context Protocol.

### Architecture

- Standalone Node.js server: `mcp/spiteprojects-mcp.js`
- Uses stdio transport (standard for MCP)
- Reads from same data files as web API
- Zero network calls - local data access

### Available Tools

1. **list_spite_projects** - Browse all projects, filter by label
2. **get_spite_score** - Get spite score and roast for a project
3. **get_random_project** - Random project for inspiration
4. **search_projects** - Fuzzy search by name/description

### Installation

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "spiteprojects": {
      "command": "node",
      "args": ["/absolute/path/to/spiteprojects-dot-com/mcp/spiteprojects-mcp.js"]
    }
  }
}
```

### Use Cases

- "Show me spite projects about replacing SaaS"
- "What's the spite score for [project name]?"
- "Give me a random spite project for inspiration"
- "Search for projects built in a weekend"

### Future MCP Enhancements

- Add resource support (serve project READMEs)
- Add prompts for common queries
- Stats and analytics tools
- Submit project tool (if API supports it)

## Backward Compatibility

### Legacy Endpoints

Original endpoints remain for backward compatibility:

- `/api/projects` → use `/api/v1/projects` instead
- `/api/projects/:id/pricing` → use `/api/v1/projects/:name/pricing` instead
- `/api/builders` → use `/api/v1/builders` instead

Legacy endpoints:
- No rate limiting headers
- No consistent response wrapper
- No pagination metadata
- Will remain available indefinitely

## Metrics & Monitoring

### What we track

- Request counts per endpoint
- Rate limit hits
- Error rates
- Response times

### What we don't track

- User behavior
- Personal information
- Analytics cookies
- Third-party tracking

Logs are server-side only. No client-side analytics.

## Support & Documentation

### Getting Help

1. Read the docs: `/api.html`
2. Check examples: Inline curl examples in docs
3. GitHub issues: For bugs and feature requests
4. No email support. No phone support. No meetings.

### Contributing

API improvements welcome via PR:
- New endpoints (if genuinely useful)
- Better error messages
- Documentation fixes
- Bug fixes

Not welcome:
- Unnecessary complexity
- Breaking changes to v1
- Features that require meetings to use

## Philosophy: Spite-Driven API Design

### Lessons from Spite

**What makes APIs terrible:**
- Requiring sales calls for access
- Arbitrary rate limits to push paid tiers
- Over-engineered "REST" that isn't RESTful
- Documentation as an afterthought
- Authentication complexity for public data
- Versioning chaos and constant breaking changes

**What we do instead:**
- Free access. Open data. No gates.
- Honest rate limits with clear headers
- Actually RESTful design
- Docs are a first-class feature
- No auth for public endpoints
- Stable v1 with additive-only changes

### The Spite Test

Before adding any API feature, ask:

1. Would this require a sales call at a typical SaaS company?
   - **If yes**: Make it free and self-service
2. Would this require "enterprise onboarding"?
   - **If yes**: Make it work with a single curl command
3. Would this normally be paywalled?
   - **If yes**: Make it part of the free tier

If a feature fails the spite test, reconsider whether it belongs in this API.

---

Built with spite, maintained with rage, documented with care. ✊
