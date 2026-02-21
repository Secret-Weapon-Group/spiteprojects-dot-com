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

// Parse listings from data/listings.md
function loadListings() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '../data/listings.md'), 'utf-8');
    const listings = [];

    // Find YAML code blocks after "## Listings"
    const listingsSection = content.split('## Listings')[1];
    if (!listingsSection) return [];

    const yamlBlockRegex = /```yaml\n([\s\S]*?)```/g;
    let match;

    while ((match = yamlBlockRegex.exec(listingsSection)) !== null) {
      const yamlContent = match[1];
      const lines = yamlContent.split('\n');
      let current = null;

      for (const line of lines) {
        if (line.startsWith('- name:')) {
          if (current) listings.push(current);
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

      if (current) listings.push(current);
    }

    return listings;
  } catch (err) {
    console.error('Failed to load listings:', err.message);
    return [];
  }
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
