const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Rate limiting tracker (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Rate limiting middleware for API routes
function rateLimitMiddleware(req, res, next) {
  if (!req.path.startsWith('/api/v1/')) {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  let clientData = rateLimitStore.get(ip);

  if (!clientData || now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    clientData = {
      windowStart: now,
      count: 0
    };
    rateLimitStore.set(ip, clientData);
  }

  clientData.count++;

  const remaining = Math.max(0, RATE_LIMIT_MAX - clientData.count);
  const resetTime = new Date(clientData.windowStart + RATE_LIMIT_WINDOW);

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime.toISOString());

  if (clientData.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Slow down there, champ. Free tier is 100 req/min.',
      limit: RATE_LIMIT_MAX,
      remaining: 0,
      reset: resetTime.toISOString()
    });
  }

  next();
}

// CORS middleware for public API
function corsMiddleware(req, res, next) {
  if (req.path.startsWith('/api/v1/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
  }
  next();
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Apply CORS and rate limiting
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

app.use(express.static(path.join(__dirname, '../public')));

// Generic YAML parser for our markdown files
function parseYamlFromMarkdown(content, sectionName) {
  const items = [];

  // Find YAML code blocks after the specified section
  const section = content.split(`## ${sectionName}`)[1];
  if (!section) return [];

  const yamlBlockRegex = /```yaml\n([\s\S]*?)```/g;
  let match;

  while ((match = yamlBlockRegex.exec(section)) !== null) {
    const yamlContent = match[1];
    const lines = yamlContent.split('\n');
    let current = null;

    for (const line of lines) {
      if (line.startsWith('- name:')) {
        if (current) items.push(current);
        current = { name: line.replace('- name:', '').trim() };
      } else if (current && line.startsWith('  ')) {
        const trimmed = line.trim();
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
          const key = trimmed.slice(0, colonIdx).trim();
          let value = trimmed.slice(colonIdx + 1).trim();

          // Handle arrays
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(s => s.trim());
          }

          // Handle booleans
          if (value === 'true') value = true;
          if (value === 'false') value = false;

          // Handle nested app object
          if (key === 'android' || key === 'ios') {
            current.app = current.app || {};
            current.app[key] = value;
          } else {
            current[key] = value;
          }
        }
      }
    }

    if (current) items.push(current);
  }

  return items;
}

// Parse listings from data/listings.md
function loadListings() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '../data/listings.md'), 'utf-8');
    return parseYamlFromMarkdown(content, 'Listings');
  } catch (err) {
    console.error('Failed to load listings:', err.message);
    return [];
  }
}

// Parse builders from data/builders.md
function loadBuilders() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '../data/builders.md'), 'utf-8');
    return parseYamlFromMarkdown(content, 'Builders');
  } catch (err) {
    console.error('Failed to load builders:', err.message);
    return [];
  }
}

// Vanity URL routing middleware
app.use((req, res, next) => {
  // Skip API routes, static files, and health check
  if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.includes('.')) {
    return next();
  }

  // Extract vanity slug from path (e.g., /myapp -> myapp)
  const vanitySlug = req.path.slice(1).split('/')[0];

  if (!vanitySlug) {
    return next();
  }

  // Check if any project has this vanity slug
  const listings = loadListings();
  const project = listings.find(p => p.vanity === vanitySlug);

  if (project && project.web) {
    // Send a brief redirect page with spite
    const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${project.web}">
  <title>Redirecting with Spite</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
    }
    .spite {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    .message {
      font-size: 1.5rem;
      font-weight: 300;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spite">✊</div>
    <div class="message">Redirecting with Spite...</div>
  </div>
</body>
</html>
    `;
    return res.status(302).send(redirectHtml);
  }

  next();
});

// Deterministic pricing generator
function generatePricing(projectName, projectDescription) {
  // Use project name as seed for deterministic randomness
  const seed = (projectName + projectDescription).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min, max, offset = 0) => {
    const val = ((seed + offset) * 9301 + 49297) % 233280;
    return min + (val / 233280) * (max - min);
  };

  const basePrice = Math.floor(random(50000, 150000, 1) / 1000) * 1000;
  const ssoTax = Math.floor(random(25000, 75000, 2) / 1000) * 1000;
  const supportFee = Math.floor(random(15000, 45000, 3) / 1000) * 1000;
  const complianceFee = Math.floor(random(30000, 80000, 4) / 1000) * 1000;
  const innovationCredits = Math.floor(random(10000, 35000, 5) / 1000) * 1000;
  const apiIncrease = Math.floor(random(20000, 60000, 6) / 1000) * 1000;
  const onboarding = Math.floor(random(40000, 100000, 7) / 1000) * 1000;
  const seatLicense = Math.floor(random(500, 2000, 8) / 100) * 100;

  const tiers = [
    {
      name: "Startup",
      price: "$0/year",
      description: "Just use the free version",
      features: [
        "Full access to the spite project",
        "No artificial limitations",
        "Actual source code included",
        "No vendor lock-in",
        "Community support (i.e., GitHub issues)"
      ],
      highlighted: false
    },
    {
      name: "Business",
      price: `$${(basePrice * 0.5).toLocaleString()}/year`,
      description: "For teams who hate money",
      features: [
        "Everything in free version",
        `Per-seat licensing: $${seatLicense}/user/month`,
        `Base platform fee: $${(basePrice * 0.3).toLocaleString()}`,
        "Email support (3-5 business days)",
        "Quarterly business reviews (required)",
        "Custom invoice terms (net 90)"
      ],
      lineItems: [
        { name: "Base Platform Fee", price: basePrice * 0.3 },
        { name: "Per-Seat Licensing (10 users minimum)", price: seatLicense * 10 * 12 }
      ],
      meetings: 4,
      timeline: "3-6 months",
      highlighted: false
    },
    {
      name: "Enterprise",
      price: `$${basePrice.toLocaleString()}/year`,
      description: "Now we're talking",
      features: [
        "Everything in Business",
        `SSO Tax: +$${ssoTax.toLocaleString()}`,
        `Premium Support: +$${supportFee.toLocaleString()} (email only)`,
        `Compliance Add-on: +$${complianceFee.toLocaleString()}`,
        "Dedicated account manager",
        "Monthly sync meetings (mandatory)",
        "Priority bug fixes (same timeline)",
        "Custom SLA (that we'll miss)"
      ],
      lineItems: [
        { name: "Base Platform Fee", price: basePrice },
        { name: "SSO Tax", price: ssoTax },
        { name: "Premium Support Package", price: supportFee },
        { name: "Compliance & Security Add-on", price: complianceFee }
      ],
      meetings: 12,
      timeline: "6-12 months",
      highlighted: false
    },
    {
      name: "Enterprise Plus",
      price: `$${(basePrice + ssoTax + supportFee + complianceFee + innovationCredits + apiIncrease).toLocaleString()}/year`,
      description: "Because you have too much budget",
      features: [
        "Everything in Enterprise",
        `Innovation Credits: +$${innovationCredits.toLocaleString()} (unused)`,
        `API Rate Limit Increase: +$${apiIncrease.toLocaleString()}`,
        `White-Glove Onboarding: +$${onboarding.toLocaleString()}`,
        "Bi-weekly strategy sessions",
        "Executive business reviews",
        "Custom feature roadmap (ignored)",
        "24/7 support (voicemail)",
        "On-site training (via Zoom)"
      ],
      lineItems: [
        { name: "Base Platform Fee", price: basePrice },
        { name: "SSO Tax", price: ssoTax },
        { name: "Premium Support Package", price: supportFee },
        { name: "Compliance & Security Add-on", price: complianceFee },
        { name: "Innovation Credits", price: innovationCredits },
        { name: "API Rate Limit Increase", price: apiIncrease },
        { name: "White-Glove Onboarding", price: onboarding }
      ],
      meetings: 24,
      timeline: "12-18 months",
      highlighted: true
    },
    {
      name: "Contact Sales",
      price: "Let's talk",
      description: "We'll make up a number together",
      features: [
        "Everything in Enterprise Plus",
        "Custom pricing (higher)",
        "Unlimited meetings",
        "Blockchain integration (somehow)",
        "AI-powered insights (ChatGPT wrapper)",
        "Multi-year commitment required",
        "Reference customer obligations",
        "Vendor assessment forms (many)",
        "Proof of concept (that becomes production)"
      ],
      lineItems: [],
      meetings: "Unlimited",
      timeline: "18-36 months",
      highlighted: false
    }
  ];

  return {
    projectName,
    tiers,
    disclaimer: "Your spite project: $0 - Available right now - Zero meetings required"
  };
}

// API Routes

// Legacy API routes (kept for backward compatibility)
app.get('/api/projects', (req, res) => {
  const listings = loadListings();
  const label = req.query.label;

  let result = listings;

  if (label) {
    result = listings.filter(p => p.labels?.includes(label));
  }

  res.json(result);
});

app.get('/api/projects/:id/pricing', (req, res) => {
  const listings = loadListings();
  const projectId = decodeURIComponent(req.params.id);

  const project = listings.find(p => p.name === projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const pricing = generatePricing(project.name, project.description || '');
  res.json(pricing);
});

app.get('/api/builders', (req, res) => {
  const builders = loadBuilders();
  res.json(builders);
});

// Public API v1 Routes

// GET /api/v1/projects - List all spite projects
app.get('/api/v1/projects', (req, res) => {
  const listings = loadListings();
  const label = req.query.label;
  const limit = parseInt(req.query.limit) || undefined;
  const offset = parseInt(req.query.offset) || 0;

  let result = listings;

  // Filter by label if provided
  if (label) {
    result = listings.filter(p => p.labels?.includes(label));
  }

  // Pagination
  const total = result.length;
  if (limit) {
    result = result.slice(offset, offset + limit);
  }

  res.json({
    data: result,
    meta: {
      total,
      limit: limit || total,
      offset,
      count: result.length
    }
  });
});

// GET /api/v1/projects/:name - Get a specific project
app.get('/api/v1/projects/:name', (req, res) => {
  const listings = loadListings();
  const projectName = decodeURIComponent(req.params.name);

  const project = listings.find(p => p.name === projectName);

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: `No spite project found with name: ${projectName}`
    });
  }

  res.json({
    data: project
  });
});

// GET /api/v1/projects/:name/spite-score - Get project's spite score
app.get('/api/v1/projects/:name/spite-score', (req, res) => {
  const listings = loadListings();
  const projectName = decodeURIComponent(req.params.name);

  const project = listings.find(p => p.name === projectName);

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: `No spite project found with name: ${projectName}`
    });
  }

  res.json({
    data: {
      name: project.name,
      spite_score: project.spite_score || null,
      spite_roast: project.spite_roast || null,
      badges: project.badges || []
    }
  });
});

// GET /api/v1/projects/:name/pricing - Get enterprise pricing
app.get('/api/v1/projects/:name/pricing', (req, res) => {
  const listings = loadListings();
  const projectName = decodeURIComponent(req.params.name);

  const project = listings.find(p => p.name === projectName);

  if (!project) {
    return res.status(404).json({
      error: 'Project not found',
      message: `No spite project found with name: ${projectName}`
    });
  }

  const pricing = generatePricing(project.name, project.description || '');
  res.json({
    data: pricing
  });
});

// GET /api/v1/builders - List all spite builders
app.get('/api/v1/builders', (req, res) => {
  const builders = loadBuilders();
  const limit = parseInt(req.query.limit) || undefined;
  const offset = parseInt(req.query.offset) || 0;

  let result = builders;

  // Pagination
  const total = result.length;
  if (limit) {
    result = result.slice(offset, offset + limit);
  }

  res.json({
    data: result,
    meta: {
      total,
      limit: limit || total,
      offset,
      count: result.length
    }
  });
});

// GET /api/v1/stats - Platform statistics
app.get('/api/v1/stats', (req, res) => {
  const listings = loadListings();
  const builders = loadBuilders();

  const totalSpiteScore = listings.reduce((sum, p) => {
    return sum + (parseFloat(p.spite_score) || 0);
  }, 0);

  const avgSpiteScore = listings.length > 0 ? totalSpiteScore / listings.length : 0;

  const projectsWithScores = listings.filter(p => p.spite_score !== undefined).length;

  // Count badges
  const badgeCounts = {};
  listings.forEach(p => {
    (p.badges || []).forEach(badge => {
      badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
    });
  });

  // Count labels
  const labelCounts = {};
  listings.forEach(p => {
    (p.labels || []).forEach(label => {
      labelCounts[label] = (labelCounts[label] || 0) + 1;
    });
  });

  res.json({
    data: {
      projects: {
        total: listings.length,
        with_spite_scores: projectsWithScores
      },
      builders: {
        total: builders.length
      },
      spite_scores: {
        total: totalSpiteScore,
        average: Math.round(avgSpiteScore * 10) / 10,
        highest: Math.max(...listings.map(p => parseFloat(p.spite_score) || 0))
      },
      badges: badgeCounts,
      labels: labelCounts
    }
  });
});

// GET /api/v1/random - Random spite project
app.get('/api/v1/random', (req, res) => {
  const listings = loadListings();

  if (listings.length === 0) {
    return res.status(404).json({
      error: 'No projects found',
      message: 'No spite projects available. Be the first to submit!'
    });
  }

  const randomIndex = Math.floor(Math.random() * listings.length);
  const project = listings[randomIndex];

  res.json({
    data: project
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Sitemap (aka Spitemap) - generates dynamic XML sitemap
app.get(['/sitemap.xml', '/spitemap.xml'], (req, res) => {
  const baseUrl = 'https://spiteprojects.com';
  const listings = loadListings();

  // Static pages
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/builders.html', priority: '0.8', changefreq: 'weekly' },
    { loc: '/manifesto.html', priority: '0.7', changefreq: 'monthly' },
    { loc: '/api.html', priority: '0.6', changefreq: 'monthly' },
    { loc: '/about.html', priority: '0.5', changefreq: 'monthly' },
    { loc: '/badges.html', priority: '0.5', changefreq: 'monthly' },
    { loc: '/spitecon.html', priority: '0.6', changefreq: 'monthly' },
    { loc: '/terms.html', priority: '0.3', changefreq: 'yearly' },
    { loc: '/privacy.html', priority: '0.3', changefreq: 'yearly' }
  ];

  // Generate XML
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
  <!-- Project vanity URLs -->
${listings.filter(p => p.vanity).map(p => `  <url>
    <loc>${baseUrl}/${p.vanity}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const robots = `# Spite Projects - robots.txt
# Built with spite, indexed with grace

User-agent: *
Allow: /

# Sitemap (we call it spitemap, but search engines don't appreciate the humor)
Sitemap: https://spiteprojects.com/sitemap.xml

# Alternative for spite enthusiasts
# Sitemap: https://spiteprojects.com/spitemap.xml

# No spite left behind
Crawl-delay: 1
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Spite Projects running on port ${PORT}`);
});
