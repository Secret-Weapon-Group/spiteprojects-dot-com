const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Sample spite projects data (will move to database later)
const spiteProjects = [
  {
    id: 1,
    name: "spiteprojects.com",
    url: "https://github.com/asah/spiteprojects-dot-com",
    description: "This very site - built out of spite against commercialization of simple vibe coding",
    submittedBy: "asah",
    addedAt: new Date().toISOString()
  }
];

// API: List all projects
app.get('/api/projects', (req, res) => {
  res.json(spiteProjects);
});

// API: Submit a new project
app.post('/api/projects', (req, res) => {
  const { name, url, description, submittedBy } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  const project = {
    id: spiteProjects.length + 1,
    name,
    url,
    description: description || '',
    submittedBy: submittedBy || 'anonymous',
    addedAt: new Date().toISOString()
  };

  spiteProjects.push(project);
  res.status(201).json(project);
});

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Spite Projects running on port ${PORT}`);
});
