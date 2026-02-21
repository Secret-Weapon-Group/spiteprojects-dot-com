# SpiteProjects Blocklist

This file blocks projects by URL pattern. Blocked projects are hidden from listings and rejected on submission.

## Syntax

```
# Comments start with #
# Blank lines are ignored

# Exact match
https://github.com/badactor/malware-repo

# Wildcard (*) - matches any characters
https://github.com/spammer/*
*.malware-domain.com/*

# Regex (enclosed in /.../)
/https:\/\/github\.com\/user-\d+\/.*/
/.*crypto.*scam.*/i

# Block by git host + username
github.com/known-spammer
gitlab.com/another-spammer

# Block entire domains (for web/app links)
malware-site.com
phishing-domain.net
```

## Active Blocks

### Blocked Repositories
```
# Example blocks (none yet)
# https://github.com/example/blocked-repo
```

### Blocked Domains
```
# Known malicious domains
# Add domains here as needed
```

### Blocked Patterns
```
# Suspicious patterns
/.*free.*bitcoin.*/i
/.*crypto.*airdrop.*/i
/.*casino.*/i
```

### Blocked Users/Orgs
```
# Block all repos from specific accounts
# github.com/known-bad-actor
```

## Audit Log

| Date | Action | Pattern | Reason | By |
|------|--------|---------|--------|-----|
| 2025-02-20 | Created | - | Initial blocklist | system |

## Notes

- Patterns are checked against: repo URL, web URL, app URLs
- Regex patterns use JavaScript regex syntax
- Case-insensitive matching with /i flag
- Changes take effect immediately on next request
- Consider adding to Git history for audit trail
