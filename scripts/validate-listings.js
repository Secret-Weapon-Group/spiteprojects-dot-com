#!/usr/bin/env node

/**
 * Validates data/listings.md format
 * Used by pre-commit hook and CI
 */

const fs = require('fs');
const path = require('path');

const LISTINGS_PATH = path.join(__dirname, '../data/listings.md');
const BLOCKLIST_PATH = path.join(__dirname, '../data/blocklist.md');

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NAME_LENGTH = 100;
const MAX_LABELS = 10;
const LABEL_PATTERN = /^[a-z0-9-]+$/;

const ALLOWED_APP_DOMAINS = [
  'play.google.com',
  'apps.apple.com',
  'f-droid.org',
];

function loadBlocklist() {
  try {
    const content = fs.readFileSync(BLOCKLIST_PATH, 'utf-8');
    const patterns = [];
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = content.match(codeBlockRegex) || [];

    for (const block of matches) {
      const lines = block.split('\n').slice(1, -1);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          patterns.push(trimmed);
        }
      }
    }
    return patterns;
  } catch (err) {
    return [];
  }
}

function isBlocked(url, patterns) {
  for (const pattern of patterns) {
    if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
      const lastSlash = pattern.lastIndexOf('/');
      const regexStr = pattern.slice(1, lastSlash);
      const flags = pattern.slice(lastSlash + 1);
      try {
        const regex = new RegExp(regexStr, flags);
        if (regex.test(url)) return true;
      } catch (e) {}
    } else if (pattern.includes('*')) {
      const regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      if (new RegExp(`^${regexStr}$`, 'i').test(url)) return true;
    } else {
      if (url.toLowerCase().includes(pattern.toLowerCase())) return true;
    }
  }
  return false;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function parseListings(content) {
  const listings = [];
  const errors = [];

  // Find all YAML code blocks after "## Listings"
  const listingsSection = content.split('## Listings')[1];
  if (!listingsSection) {
    errors.push('Missing "## Listings" section');
    return { listings, errors };
  }

  const yamlBlockRegex = /```yaml\n([\s\S]*?)```/g;
  let match;

  while ((match = yamlBlockRegex.exec(listingsSection)) !== null) {
    const yamlContent = match[1];

    // Simple YAML parser for our format
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

  return { listings, errors };
}

function validateListing(listing, index, blocklistPatterns) {
  const errors = [];
  const prefix = `Listing ${index + 1} (${listing.name || 'unnamed'})`;

  // Required: name
  if (!listing.name) {
    errors.push(`${prefix}: missing required field 'name'`);
  } else if (listing.name.length > MAX_NAME_LENGTH) {
    errors.push(`${prefix}: name exceeds ${MAX_NAME_LENGTH} characters`);
  }

  // Required: author
  if (!listing.author) {
    errors.push(`${prefix}: missing required field 'author'`);
  }

  // Required: description
  if (!listing.description) {
    errors.push(`${prefix}: missing required field 'description'`);
  } else if (listing.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`${prefix}: description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  // Required: repo
  if (!listing.repo) {
    errors.push(`${prefix}: missing required field 'repo'`);
  } else if (!isValidUrl(listing.repo)) {
    errors.push(`${prefix}: invalid repo URL`);
  } else if (isBlocked(listing.repo, blocklistPatterns)) {
    errors.push(`${prefix}: repo URL is blocked`);
  }

  // Optional: web
  if (listing.web) {
    if (!isValidUrl(listing.web)) {
      errors.push(`${prefix}: invalid web URL`);
    } else if (isBlocked(listing.web, blocklistPatterns)) {
      errors.push(`${prefix}: web URL is blocked`);
    }
  }

  // Optional: app
  if (listing.app) {
    for (const [platform, url] of Object.entries(listing.app)) {
      if (!['android', 'ios'].includes(platform)) {
        errors.push(`${prefix}: invalid app platform '${platform}' (use 'android' or 'ios')`);
      }
      if (!isValidUrl(url)) {
        errors.push(`${prefix}: invalid ${platform} app URL`);
      } else {
        const urlObj = new URL(url);
        if (!ALLOWED_APP_DOMAINS.some(d => urlObj.hostname.endsWith(d))) {
          errors.push(`${prefix}: ${platform} URL must be from official app store`);
        }
      }
    }
  }

  // Optional: labels
  if (listing.labels) {
    if (!Array.isArray(listing.labels)) {
      errors.push(`${prefix}: labels must be an array`);
    } else {
      if (listing.labels.length > MAX_LABELS) {
        errors.push(`${prefix}: too many labels (max ${MAX_LABELS})`);
      }
      for (const label of listing.labels) {
        if (!LABEL_PATTERN.test(label)) {
          errors.push(`${prefix}: invalid label '${label}' (use lowercase-hyphenated)`);
        }
      }
    }
  }

  // Optional: thumbnail
  if (listing.thumbnail && !isValidUrl(listing.thumbnail)) {
    errors.push(`${prefix}: invalid thumbnail URL`);
  }

  return errors;
}

function checkAlphabeticalOrder(listings) {
  const errors = [];
  for (let i = 1; i < listings.length; i++) {
    const prev = listings[i - 1].name?.toLowerCase() || '';
    const curr = listings[i].name?.toLowerCase() || '';
    if (prev > curr) {
      errors.push(`Listings not alphabetically sorted: '${listings[i - 1].name}' should come after '${listings[i].name}'`);
    }
  }
  return errors;
}

function main() {
  console.log('Validating data/listings.md...\n');

  if (!fs.existsSync(LISTINGS_PATH)) {
    console.error('Error: data/listings.md not found');
    process.exit(1);
  }

  const content = fs.readFileSync(LISTINGS_PATH, 'utf-8');
  const blocklistPatterns = loadBlocklist();

  const { listings, errors: parseErrors } = parseListings(content);

  const allErrors = [...parseErrors];

  // Validate each listing
  for (let i = 0; i < listings.length; i++) {
    allErrors.push(...validateListing(listings[i], i, blocklistPatterns));
  }

  // Check alphabetical order
  allErrors.push(...checkAlphabeticalOrder(listings));

  // Check for duplicates
  const repos = new Set();
  for (const listing of listings) {
    if (listing.repo && repos.has(listing.repo)) {
      allErrors.push(`Duplicate repo: ${listing.repo}`);
    }
    repos.add(listing.repo);
  }

  if (allErrors.length > 0) {
    console.error('Validation failed:\n');
    for (const error of allErrors) {
      console.error(`  - ${error}`);
    }
    console.error(`\n${allErrors.length} error(s) found.`);
    process.exit(1);
  }

  console.log(`✓ Validated ${listings.length} listing(s) successfully.`);
  process.exit(0);
}

main();
