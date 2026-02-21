# Brainstorm: Making Spite Projects Go Viral

## The Core Insight

Spite is relatable. Everyone has:
- Been told something would take 6 months
- Paid for SaaS that could be a bash script
- Watched a simple feature turn into a 47-person committee

This is emotional. Lean into it.

---

## 🔥 Viral/Marketing Features

### 1. The Spite Score™
An LLM rates every project's spite level 1-10 with a snarky explanation.

```
Spite Score: 9.2/10
"You built a fully-functional CRM in a weekend because Salesforce
wanted $150/user/month. The audacity. The pettiness. *chef's kiss*"
```

### 2. Enterprise Cost Calculator
Shows what the "enterprise equivalent" would cost:
```
┌─────────────────────────────────────────────┐
│  YOUR SPITE PROJECT: simple-deploy.sh       │
│  ─────────────────────────────────────────  │
│  Enterprise Equivalent: Jenkins + K8s +     │
│  Terraform + 3 DevOps engineers             │
│                                             │
│  💰 Estimated Annual Cost: $847,000         │
│  ⏱️  Estimated Implementation: 18 months    │
│  📋 Required Meetings: 412                  │
│                                             │
│  Your version: Free. Built Tuesday.         │
└─────────────────────────────────────────────┘
```

### 3. "They Said It Would Take..." Badge
Projects display their origin story:
```
🏷️ "They said: 6 sprints"
⚡ "Actually took: 1 weekend"
```

### 4. Spite of the Week
Featured project with:
- Origin story
- LLM-generated "enterprise proposal" parody
- Social sharing optimized

### 5. The Wall of Shame (Corporate Edition)
Anonymous submissions of real quotes from real meetings:
- "We need to form a working group first"
- "Let's circle back in Q3"
- "Have you considered using our approved vendor?"

---

## 🤖 Self-Referential LLM Features (The Meta Stuff)

### 1. Claude Reviews Your Spite
Submit your repo URL, Claude reads it and writes a review:
- Rates the spite level
- Identifies who you're probably mad at
- Suggests ways to make it MORE spiteful
- Generates a "corporate translation" of your README

### 2. The Enterprise Proposal Generator
Paste your simple project, get back a 47-page enterprise RFP:
```
Input: "Bash script that deploys to prod"

Output: "PROPOSAL FOR ENTERPRISE-GRADE CONTINUOUS DEPLOYMENT
ORCHESTRATION PLATFORM WITH MULTI-CLOUD SYNERGY..."
(continues for 12 pages)
```

### 3. Passive-Aggressive Changelog Generator
```
v1.0.1 - Added the feature that "definitely needed a committee"
v1.0.0 - Initial release. Yes, it works. No, we didn't need Jira.
```

### 4. Corporate Rejection Letter Generator
For spam/bad submissions, Claude writes rejection letters:
```
"Thank you for your submission. After careful review by our
cross-functional stakeholder alignment committee, we regret to
inform you that your project does not meet our synergy requirements.

Please resubmit after a 6-month enterprise readiness assessment."
```

### 5. The Infinite Spite Loop
A spite project about spite projects:
- This site itself is a spite project
- Users can submit spite projects about the spite projects site
- Claude moderates by generating increasingly meta commentary
- Eventually we need a spite project to manage the spite projects about spite projects

### 6. "What Would Enterprise Do?"
Toggle button on every project page that shows:
- The 47-person org chart needed
- The 18-month roadmap
- The compliance checklist
- The vendor selection process
- The budget approval workflow

---

## 🌐 Subdomain/Vanity URL System

### How It Works

In `listings.md`:
```yaml
- name: myfunkyapp
  author: spiteful-dev
  repo: https://github.com/spiteful-dev/myfunkyapp
  web: https://myfunkyapp.com
  # New fields:
  vanity: myfunkyapp  # enables spiteprojects.com/myfunkyapp AND myfunkyapp.spiteprojects.com
  iframe: true        # can be embedded
  trusted: true       # manually approved for subdomain
```

### URL Routing
- `spiteprojects.com/myfunkyapp` → redirect to project's `web` URL
- `myfunkyapp.spiteprojects.com` → same redirect (requires DNS wildcard)
- Both show brief "Hosted with Spite ✊" interstitial (optional)

### Trust Levels
1. **Listed** - Just in directory
2. **Vanity** - Gets /projectname path
3. **Subdomain** - Gets projectname.spiteprojects.com (manual approval)
4. **Hosted** - Future: actually hosted on our infra

### Iframe Embedding
For `iframe: true` projects:
- `spiteprojects.com/myfunkyapp?embed=1` shows iframe wrapper
- Spite-themed frame with "Powered by Spite" header
- Quick escape to full site
- Analytics (spite-respecting, no tracking)

---

## 🎨 Other Wild Ideas

### Badges & Achievements
- 🏃 **Speed Run** - First commit to production < 24 hours
- ☕ **One Coffee Build** - Built during a single coffee break
- 💢 **Rage Quit Result** - Built immediately after quitting something
- 🌙 **3am Spite** - Committed between 2-5am
- 🔄 **Full Circle** - Replaced something that replaced something you built
- 🎯 **Surgical Strike** - Under 100 lines of code
- 🦣 **Mammoth Slayer** - Replaced enterprise software

### The Manifesto Page
Over-the-top declaration of principles:
```
WE HOLD THESE TRUTHS TO BE SELF-EVIDENT:

That all software projects are NOT created equal,
That some are born from spite, and these are SUPERIOR,
That the best code is written at 2am fueled by pure
indignation at a $50,000 vendor quote...
```

### Spite Stories (Blog/Podcast?)
Origin stories of famous spite projects:
- Linux (spite against MINIX licensing)
- SQLite (spite against Oracle)
- Let's Encrypt (spite against certificate racket)

### The Reverse Job Board
```
┌────────────────────────────────────────────┐
│  DON'T HIRE US TO BUILD:                   │
│  ────────────────────────────────────────  │
│  ✓ Simple CRM - already exists, free       │
│  ✓ Basic auth system - it's 50 lines       │
│  ✓ File upload service - literally done    │
│                                            │
│  We will NOT take your money for this.     │
└────────────────────────────────────────────┘
```

### Enterprise Mode Easter Egg
Konami code transforms the site:
- Comic Sans becomes Arial
- Dark mode becomes "Corporate Blue™"
- All text becomes 40% longer with no added meaning
- Loading spinners everywhere
- "Please contact your administrator" errors
- Projects require "license key" (any text works)

### GitHub Integration Ideas
- Actual time tracking: first commit → first deploy
- "Lines of code saved" vs enterprise equivalent
- Contributor spite score based on commit messages
- Auto-detect rage commits (all caps, profanity, etc.)

### Social Features
- "I built this instead of..." confessions
- Upvote projects by how much spite you feel
- Share cards: "I saved $847,000/year with this one weird script"
- "Sounds like something I'd build" button

### The Spite API
Let other tools integrate:
```
GET /api/spite-score?repo=github.com/user/repo
{
  "score": 8.7,
  "summary": "Peak passive-aggressive energy",
  "enterprise_equivalent_cost": 450000,
  "meetings_avoided": 89
}
```

---

## 📋 What's Actually Needed First

### Must Have (MVP+)
1. Subdomain/vanity URL system (low effort, high perceived value)
2. Spite Score via LLM (the hook, the viral bit)
3. Social share cards with spite stats
4. Basic iframe embedding support

### Should Have
5. Enterprise Cost Calculator (funny, shareable)
6. Featured "Spite of the Week"
7. Badges system
8. Origin story field in listings

### Nice to Have
9. Enterprise Mode easter egg
10. Claude-powered submission review
11. The Manifesto
12. Spite API

### Wild Cards (If It Takes Off)
13. Podcast/blog with spite stories
14. Hosted option for trusted projects
15. Spite certification program
16. Conference? SpiteCon?

---

## Next Steps

1. Add vanity URL support to listings.md schema
2. Implement basic redirect routing for /projectname
3. Set up wildcard DNS for *.spiteprojects.com
4. Build Spite Score integration (Claude API call on submission)
5. Design share cards with spite stats

---

*This brainstorm itself was written with Claude, making it a spite project
about spite projects generated by the thing that generates spite projects.
We've achieved peak meta.*
