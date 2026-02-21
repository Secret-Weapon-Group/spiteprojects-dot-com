#!/usr/bin/env node

/**
 * Spite Score™ Generator
 *
 * Generates spite_score and spite_roast for projects in data/listings.md
 * that don't already have them.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npm run generate-scores
 *
 * Or:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   npm run generate-scores
 *
 * The script:
 * - Reads all projects from data/listings.md
 * - Finds projects without spite_score
 * - Calls Claude API to evaluate each one
 * - Updates the file in-place with scores and roasts
 * - Is safe to run multiple times (skips projects that already have scores)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const LISTINGS_PATH = path.join(__dirname, '../data/listings.md');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5-20250929';

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  console.error('Usage: ANTHROPIC_API_KEY=sk-... npm run generate-scores');
  process.exit(1);
}

const SPITE_SCORE_PROMPT = `You are the Spite Score™ evaluator for spiteprojects.com - a directory of AI projects built out of spite, rage, and weekend warrior energy.

Your job is to assign a Spite Score (1-10, one decimal place) and write a snarky 1-2 sentence roast.

Evaluate based on:
- **Spitefulness of purpose**: Did they build this to prove someone wrong? To replace something that pissed them off?
- **Simplicity over complexity**: Did they replace an expensive/bloated solution with something beautifully simple?
- **Evident rage**: Can you feel the "screw this, I'll do it myself" energy in the description?
- **Weekend project vibes**: Does this scream "I built this in 48 hours fueled by caffeine and spite"?

Scoring guide:
- 1-3: Barely spite, more like mild annoyance
- 4-6: Respectable spite, clear anti-establishment energy
- 7-8: Pure concentrated spite, weekend warrior excellence
- 9-10: Legendary spite, the stuff of folklore

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"spite_score": 7.5, "spite_roast": "Your snarky roast here."}

Project to evaluate:
Name: {name}
Author: {author}
Description: {description}`;

function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API error: ${res.statusCode} - ${body}`));
          return;
        }

        try {
          const response = JSON.parse(body);
          const content = response.content[0].text;
          resolve(content);
        } catch (err) {
          reject(new Error(`Failed to parse API response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

function parseListings(content) {
  const sections = [];
  const listingsSection = content.split('## Listings');

  if (listingsSection.length < 2) {
    throw new Error('Missing "## Listings" section');
  }

  const beforeListings = content.substring(0, content.indexOf('## Listings') + '## Listings'.length);
  const afterListings = listingsSection[1];

  const yamlBlockRegex = /```yaml\n([\s\S]*?)```/g;
  let match;
  let lastIndex = 0;

  while ((match = yamlBlockRegex.exec(afterListings)) !== null) {
    // Add content before this block
    if (match.index > lastIndex) {
      sections.push({
        type: 'text',
        content: afterListings.substring(lastIndex, match.index)
      });
    }

    // Parse the YAML block
    const yamlContent = match[1];
    const listing = parseYAMLListing(yamlContent);

    sections.push({
      type: 'listing',
      yamlContent: yamlContent,
      listing: listing,
      fullMatch: match[0]
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining content
  if (lastIndex < afterListings.length) {
    sections.push({
      type: 'text',
      content: afterListings.substring(lastIndex)
    });
  }

  return { beforeListings, sections };
}

function parseYAMLListing(yamlContent) {
  const listing = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    if (line.startsWith('- name:')) {
      listing.name = line.replace('- name:', '').trim();
    } else if (line.startsWith('  ')) {
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
          listing.app = listing.app || {};
          listing.app[key] = value;
        } else {
          listing[key] = value;
        }
      }
    }
  }

  return listing;
}

function serializeYAMLListing(listing) {
  let yaml = `- name: ${listing.name}\n`;

  const fields = ['author', 'description', 'repo', 'web', 'app', 'thumbnail', 'labels', 'spite_score', 'spite_roast'];

  for (const field of fields) {
    if (listing[field] !== undefined) {
      if (field === 'app') {
        yaml += `  app:\n`;
        if (listing.app.android) yaml += `    android: ${listing.app.android}\n`;
        if (listing.app.ios) yaml += `    ios: ${listing.app.ios}\n`;
      } else if (field === 'labels' && Array.isArray(listing[field])) {
        yaml += `  labels: [${listing[field].join(', ')}]\n`;
      } else if (field === 'spite_score') {
        yaml += `  spite_score: ${listing[field]}\n`;
      } else {
        yaml += `  ${field}: ${listing[field]}\n`;
      }
    }
  }

  return yaml;
}

async function generateSpiteScore(listing) {
  console.log(`  Generating Spite Score™ for "${listing.name}"...`);

  // Escape special characters for JSON/text content
  const escapeName = (listing.name || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const escapeAuthor = (listing.author || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const escapeDescription = (listing.description || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const prompt = SPITE_SCORE_PROMPT
    .replace('{name}', escapeName)
    .replace('{author}', escapeAuthor)
    .replace('{description}', escapeDescription);

  try {
    const response = await callClaudeAPI(prompt);

    // Parse the JSON response
    const result = JSON.parse(response.trim());

    if (typeof result.spite_score !== 'number' || typeof result.spite_roast !== 'string') {
      throw new Error('Invalid response format from API');
    }

    // Round to one decimal place
    result.spite_score = Math.round(result.spite_score * 10) / 10;

    console.log(`    Score: ${result.spite_score}/10`);
    console.log(`    Roast: ${result.spite_roast}`);

    return result;
  } catch (err) {
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function main() {
  console.log('Spite Score™ Generator\n');
  console.log('Reading data/listings.md...\n');

  if (!fs.existsSync(LISTINGS_PATH)) {
    console.error('Error: data/listings.md not found');
    process.exit(1);
  }

  const content = fs.readFileSync(LISTINGS_PATH, 'utf-8');
  const { beforeListings, sections } = parseListings(content);

  let modified = false;
  let processedCount = 0;

  for (const section of sections) {
    if (section.type === 'listing') {
      const listing = section.listing;

      // Check if already has spite_score
      if (listing.spite_score !== undefined) {
        console.log(`✓ "${listing.name}" already has Spite Score™: ${listing.spite_score}/10`);
        continue;
      }

      // Generate score
      try {
        const { spite_score, spite_roast } = await generateSpiteScore(listing);
        listing.spite_score = spite_score;
        listing.spite_roast = spite_roast;

        // Update the section's YAML content
        section.yamlContent = serializeYAMLListing(listing);
        section.fullMatch = '```yaml\n' + section.yamlContent + '```';

        modified = true;
        processedCount++;

        // Rate limiting: wait 1 second between API calls
        if (processedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`\nFailed to generate score for "${listing.name}": ${err.message}`);
        console.error('Aborting to avoid partial updates.\n');
        process.exit(1);
      }

      console.log('');
    }
  }

  if (modified) {
    // Reconstruct the file
    let newContent = beforeListings;
    for (const section of sections) {
      if (section.type === 'text') {
        newContent += section.content;
      } else if (section.type === 'listing') {
        newContent += section.fullMatch;
      }
    }

    // Write back to file
    fs.writeFileSync(LISTINGS_PATH, newContent, 'utf-8');
    console.log(`\n✊ Successfully generated ${processedCount} Spite Score(s) and updated data/listings.md!`);
  } else {
    console.log('\nNo listings need Spite Scores. All done!');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
