const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

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

// List all projects
app.get('/api/projects', (req, res) => {
  const listings = loadListings();
  const label = req.query.label;

  let result = listings;

  if (label) {
    result = listings.filter(p => p.labels?.includes(label));
  }

  res.json(result);
});

// Get enterprise pricing for a project
app.get('/api/projects/:id/pricing', (req, res) => {
  const listings = loadListings();
  const projectId = decodeURIComponent(req.params.id);

  // Find project by name (using name as ID)
  const project = listings.find(p => p.name === projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const pricing = generatePricing(project.name, project.description || '');
  res.json(pricing);
});

// List all builders
app.get('/api/builders', (req, res) => {
  const builders = loadBuilders();
  res.json(builders);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Spite Projects running on port ${PORT}`);
});
