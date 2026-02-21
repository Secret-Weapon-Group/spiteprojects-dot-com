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

// In-memory store (will move to database later)
const projects = [
  {
    id: '1',
    name: 'spiteprojects.com',
    author: 'asah',
    description: 'This very site - built out of spite against commercialization of simple vibe coding',
    repo: 'https://github.com/Secret-Weapon-Group/spiteprojects-dot-com',
    web: 'https://spiteprojects.com',
    app: null,
    thumbnail: null,
    labels: ['vibe-coding', 'anti-saas', 'meta'],
    activity: 'hot',
    dateSubmitted: new Date().toISOString(),
  }
];

// Load blocklist
function loadBlocklist() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '../data/blocklist.md'), 'utf-8');
    const patterns = [];

    // Extract patterns from code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = content.match(codeBlockRegex) || [];

    for (const block of matches) {
      const lines = block.split('\n').slice(1, -1); // Remove ``` lines
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          patterns.push(trimmed);
        }
      }
    }

    return patterns;
  } catch (err) {
    console.error('Failed to load blocklist:', err.message);
    return [];
  }
}

function isBlocked(url) {
  const patterns = loadBlocklist();

  for (const pattern of patterns) {
    // Regex pattern
    if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
      const lastSlash = pattern.lastIndexOf('/');
      const regexStr = pattern.slice(1, lastSlash);
      const flags = pattern.slice(lastSlash + 1);
      try {
        const regex = new RegExp(regexStr, flags);
        if (regex.test(url)) return true;
      } catch (e) {
        // Invalid regex, skip
      }
    }
    // Wildcard pattern
    else if (pattern.includes('*')) {
      const regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      if (new RegExp(`^${regexStr}$`, 'i').test(url)) return true;
    }
    // Exact match or substring
    else {
      if (url.toLowerCase().includes(pattern.toLowerCase())) return true;
    }
  }

  return false;
}

// Parse GitHub/GitLab URL
function parseRepoUrl(url) {
  const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (githubMatch) {
    return { host: 'github', owner: githubMatch[1], repo: githubMatch[2].replace(/\.git$/, '') };
  }

  const gitlabMatch = url.match(/gitlab\.com\/([^\/]+)\/([^\/]+)/);
  if (gitlabMatch) {
    return { host: 'gitlab', owner: gitlabMatch[1], repo: gitlabMatch[2].replace(/\.git$/, '') };
  }

  return null;
}

// Fetch spite metadata from repo (simplified - real impl would use GitHub API)
async function fetchSpiteMetadata(repoUrl) {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error('Unsupported git host. Use GitHub or GitLab.');
  }

  // Try to fetch .spite or SPITE.md from raw URL
  const files = ['.spite', 'SPITE.md', '.spite.yaml'];
  let metadata = null;

  for (const file of files) {
    let rawUrl;
    if (parsed.host === 'github') {
      rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/${file}`;
    } else if (parsed.host === 'gitlab') {
      rawUrl = `https://gitlab.com/${parsed.owner}/${parsed.repo}/-/raw/main/${file}`;
    }

    try {
      const res = await fetch(rawUrl);
      if (res.ok) {
        const content = await res.text();
        metadata = parseSpiteFile(content, file);
        break;
      }
    } catch (e) {
      // Try next file
    }
  }

  if (!metadata) {
    // No spite file found - create minimal metadata
    metadata = {
      name: parsed.repo,
      author: parsed.owner,
      description: '',
    };
  }

  // Ensure repo URL is set
  metadata.repo = repoUrl;

  return metadata;
}

// Parse .spite or SPITE.md content (simplified YAML parser)
function parseSpiteFile(content, filename) {
  const metadata = {};

  // Handle YAML frontmatter in SPITE.md
  if (filename === 'SPITE.md' && content.startsWith('---')) {
    const endIndex = content.indexOf('---', 3);
    if (endIndex > 0) {
      content = content.slice(3, endIndex);
    }
  }

  // Simple line-by-line YAML parsing
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Handle arrays like labels: [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        metadata[key] = value.slice(1, -1).split(',').map(s => s.trim());
      } else {
        metadata[key] = value.replace(/^["']|["']$/g, ''); // Strip quotes
      }
    }
  }

  return metadata;
}

// Validate project
function validateProject(project) {
  if (!project.name || project.name.length > 100) {
    throw new Error('Name is required and must be under 100 characters');
  }

  if (project.description && project.description.length > 500) {
    throw new Error('Description must be under 500 characters');
  }

  if (!project.repo && !project.web && !project.app) {
    throw new Error('At least one link (repo, web, or app) is required');
  }

  // Check blocklist
  const urls = [project.repo, project.web, project.app?.android, project.app?.ios].filter(Boolean);
  for (const url of urls) {
    if (isBlocked(url)) {
      throw new Error('This URL is not allowed');
    }
  }

  return true;
}

// API Routes

// List all projects
app.get('/api/projects', (req, res) => {
  const label = req.query.label;
  let result = projects;

  if (label) {
    result = projects.filter(p => p.labels?.includes(label));
  }

  // Sort by date, newest first
  result = [...result].sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted));

  res.json(result);
});

// Submit a new project
app.post('/api/projects', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  // Check if already exists
  if (projects.some(p => p.repo === repoUrl)) {
    return res.status(400).json({ error: 'This project is already listed' });
  }

  // Check blocklist
  if (isBlocked(repoUrl)) {
    return res.status(400).json({ error: 'This URL is not allowed' });
  }

  try {
    const metadata = await fetchSpiteMetadata(repoUrl);

    const project = {
      id: String(Date.now()),
      name: metadata.name,
      author: metadata.author || 'anonymous',
      description: metadata.description || '',
      repo: metadata.repo,
      web: metadata.web || null,
      app: metadata.app || null,
      thumbnail: metadata.thumbnail || null,
      labels: metadata.labels || [],
      activity: 'active', // TODO: compute from git activity
      dateSubmitted: new Date().toISOString(),
    };

    validateProject(project);
    projects.push(project);

    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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
