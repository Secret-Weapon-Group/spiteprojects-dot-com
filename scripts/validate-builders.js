#!/usr/bin/env node

/**
 * Validates data/builders.md format
 * Used by pre-commit hook and CI
 */

const fs = require('fs');
const path = require('path');

const BUILDERS_PATH = path.join(__dirname, '../data/builders.md');
const LISTINGS_PATH = path.join(__dirname, '../data/listings.md');

const MAX_TITLE_LENGTH = 100;
const MAX_NAME_LENGTH = 100;
const MAX_SPECIALTY_LENGTH = 200;

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function loadProjectNames() {
  try {
    const content = fs.readFileSync(LISTINGS_PATH, 'utf-8');
    const listingsSection = content.split('## Listings')[1];
    if (!listingsSection) return [];

    const projectNames = [];
    const nameRegex = /- name:\s*(.+)/g;
    let match;

    while ((match = nameRegex.exec(listingsSection)) !== null) {
      projectNames.push(match[1].trim());
    }

    return projectNames;
  } catch (err) {
    console.warn('Warning: Could not load project names from listings.md');
    return [];
  }
}

function parseBuilders(content) {
  const builders = [];
  const errors = [];

  // Find all YAML code blocks after "## Builders"
  const buildersSection = content.split('## Builders')[1];
  if (!buildersSection) {
    errors.push('Missing "## Builders" section');
    return { builders, errors };
  }

  const yamlBlockRegex = /```yaml\n([\s\S]*?)```/g;
  let match;

  while ((match = yamlBlockRegex.exec(buildersSection)) !== null) {
    const yamlContent = match[1];

    // Simple YAML parser for our format
    const lines = yamlContent.split('\n');
    let current = null;

    for (const line of lines) {
      if (line.startsWith('- name:')) {
        if (current) builders.push(current);
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
          if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          }

          current[key] = value;
        }
      }
    }

    if (current) builders.push(current);
  }

  return { builders, errors };
}

function validateBuilder(builder, index, projectNames) {
  const errors = [];
  const prefix = `Builder ${index + 1} (${builder.name || 'unnamed'})`;

  // Required: name
  if (!builder.name) {
    errors.push(`${prefix}: missing required field 'name'`);
  } else if (builder.name.length > MAX_NAME_LENGTH) {
    errors.push(`${prefix}: name exceeds ${MAX_NAME_LENGTH} characters`);
  }

  // Required: github
  if (!builder.github) {
    errors.push(`${prefix}: missing required field 'github'`);
  } else if (!isValidUrl(builder.github)) {
    errors.push(`${prefix}: invalid github URL`);
  } else {
    const urlObj = new URL(builder.github);
    if (!urlObj.hostname.includes('github.com')) {
      errors.push(`${prefix}: github URL must be from github.com`);
    }
  }

  // Optional: linkedin
  if (builder.linkedin) {
    if (!isValidUrl(builder.linkedin)) {
      errors.push(`${prefix}: invalid linkedin URL`);
    } else {
      const urlObj = new URL(builder.linkedin);
      if (!urlObj.hostname.includes('linkedin.com')) {
        errors.push(`${prefix}: linkedin URL must be from linkedin.com`);
      }
    }
  }

  // Required: title
  if (!builder.title) {
    errors.push(`${prefix}: missing required field 'title'`);
  } else if (builder.title.length > MAX_TITLE_LENGTH) {
    errors.push(`${prefix}: title exceeds ${MAX_TITLE_LENGTH} characters`);
  }

  // Required: available (boolean)
  if (typeof builder.available !== 'boolean') {
    errors.push(`${prefix}: 'available' must be true or false`);
  }

  // Required: spite_specialty
  if (!builder.spite_specialty) {
    errors.push(`${prefix}: missing required field 'spite_specialty'`);
  } else if (builder.spite_specialty.length > MAX_SPECIALTY_LENGTH) {
    errors.push(`${prefix}: spite_specialty exceeds ${MAX_SPECIALTY_LENGTH} characters`);
  }

  // Optional: projects (should reference valid project names)
  if (builder.projects) {
    if (!Array.isArray(builder.projects)) {
      errors.push(`${prefix}: projects must be an array`);
    } else {
      for (const projectName of builder.projects) {
        if (projectNames.length > 0 && !projectNames.includes(projectName)) {
          errors.push(`${prefix}: project '${projectName}' not found in listings.md`);
        }
      }
    }
  }

  return errors;
}

function checkAlphabeticalOrder(builders) {
  const errors = [];
  for (let i = 1; i < builders.length; i++) {
    const prev = builders[i - 1].name?.toLowerCase() || '';
    const curr = builders[i].name?.toLowerCase() || '';
    if (prev > curr) {
      errors.push(`Builders not alphabetically sorted: '${builders[i - 1].name}' should come after '${builders[i].name}'`);
    }
  }
  return errors;
}

function main() {
  console.log('Validating data/builders.md...\n');

  if (!fs.existsSync(BUILDERS_PATH)) {
    console.error('Error: data/builders.md not found');
    process.exit(1);
  }

  const content = fs.readFileSync(BUILDERS_PATH, 'utf-8');
  const projectNames = loadProjectNames();

  const { builders, errors: parseErrors } = parseBuilders(content);

  const allErrors = [...parseErrors];

  // Validate each builder
  for (let i = 0; i < builders.length; i++) {
    allErrors.push(...validateBuilder(builders[i], i, projectNames));
  }

  // Check alphabetical order
  allErrors.push(...checkAlphabeticalOrder(builders));

  // Check for duplicate GitHub profiles
  const githubUrls = new Set();
  for (const builder of builders) {
    if (builder.github && githubUrls.has(builder.github)) {
      allErrors.push(`Duplicate GitHub profile: ${builder.github}`);
    }
    githubUrls.add(builder.github);
  }

  if (allErrors.length > 0) {
    console.error('Validation failed:\n');
    for (const error of allErrors) {
      console.error(`  - ${error}`);
    }
    console.error(`\n${allErrors.length} error(s) found.`);
    process.exit(1);
  }

  console.log(`Successfully validated ${builders.length} builder(s).`);
  process.exit(0);
}

main();
