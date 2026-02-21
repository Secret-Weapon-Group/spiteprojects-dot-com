#!/usr/bin/env node

/**
 * Passive-Aggressive Changelog Generator
 *
 * Takes a GitHub repo URL and generates a snarky changelog
 * based on recent commits. Because your commit messages
 * deserve the commentary they've been asking for.
 *
 * Usage:
 *   node scripts/generate-changelog.js <repo-url>
 *   node scripts/generate-changelog.js https://github.com/user/repo
 *
 * Built with spite. ✊
 */

const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MAX_COMMITS = 30;

// Passive-aggressive templates for different commit patterns
const SNARK_PATTERNS = [
  {
    pattern: /^fix/i,
    templates: [
      "Fixed the bug that 'wasn't a priority' last sprint",
      "Fixed the thing that worked fine 'in production' apparently",
      "Fixed the issue that 'we'll get to it next quarter'",
      "Patched the bug that was 'working as intended'",
      "Resolved the 'edge case' that happened to 73% of users",
      "Fixed what the enterprise solution broke in the first place",
    ]
  },
  {
    pattern: /^add|^feat/i,
    templates: [
      "Added the feature that definitely needed a 6-person committee to approve",
      "Implemented the thing that 'would take months' (took 3 hours)",
      "Added feature that enterprise software charges $10k/year for",
      "Built the functionality that required 'extensive planning' (narrator: it didn't)",
      "Added what the $50k enterprise tool does, but worse (JK it's better)",
      "Implemented feature that needed 'stakeholder alignment' (built it anyway)",
    ]
  },
  {
    pattern: /^update|^upgrade|^bump/i,
    templates: [
      "Updated dependencies because apparently that's a full-time job now",
      "Bumped versions because semantic versioning is a lifestyle",
      "Updated the thing that will break again next Tuesday",
      "Upgraded dependencies to fix vulnerabilities we introduced last upgrade",
      "Updated packages because 'security advisory' sounds scary",
    ]
  },
  {
    pattern: /^refactor/i,
    templates: [
      "Refactored code that 'should never be touched'",
      "Cleaned up the mess left by 'senior architects'",
      "Refactored because someone said 'it works, don't change it' (changed it)",
      "Restructured the codebase that was 'perfectly fine'",
      "Refactored the 'legacy code' (written last month)",
    ]
  },
  {
    pattern: /^remove|^delete/i,
    templates: [
      "Removed the code that 'might be needed someday' (wasn't)",
      "Deleted 500 lines that did what 10 lines do now",
      "Removed the 'critical feature' nobody used",
      "Deleted code that survived 3 rewrites out of pure spite",
      "Removed the enterprise bloat (all of it)",
    ]
  },
  {
    pattern: /^test/i,
    templates: [
      "Added tests that should've existed from day one",
      "Wrote tests for code that 'works fine without them'",
      "Added test coverage because 'we trust the developers'",
      "Implemented tests that would've caught last week's incident",
    ]
  },
  {
    pattern: /^docs|^document/i,
    templates: [
      "Documented the thing that was 'self-explanatory'",
      "Added docs because 'the code documents itself' (it doesn't)",
      "Wrote documentation that will be outdated by next commit",
      "Documented the obvious because someone asked 'how does this work?'",
    ]
  },
  {
    pattern: /^merge|^Merge/,
    templates: [
      "Merged PR after resolving 47 merge conflicts (thanks, main branch)",
      "Merged changes that 'shouldn't conflict' (they did)",
      "Merged branch after extensive CI/CD pipeline (it's just npm test)",
    ]
  },
  {
    pattern: /^initial commit|^first commit/i,
    templates: [
      "Initial commit (the last time the codebase was clean)",
      "Started the project that 'can't be done' (watch me)",
      "First commit of many regrets",
      "Initial commit before the feature creep begins",
    ]
  },
  {
    pattern: /^wip|work in progress/i,
    templates: [
      "WIP commit because someone needed 'visibility into progress'",
      "Work in progress (translation: it compiles, ship it)",
      "WIP commit to satisfy the daily standup inquisition",
    ]
  },
  {
    pattern: /.*/,
    templates: [
      "Made changes that 'break best practices' (improved them)",
      "Did the thing that 'needs more discussion' (did it anyway)",
      "Implemented solution that 'wasn't the approved approach' (worked better)",
      "Built feature during 'focus time' (3am spite session)",
      "Made improvements that 'weren't in the spec' (should've been)",
      "Fixed it the right way instead of 'the enterprise way'",
    ]
  }
];

function getSnarkForCommit(message) {
  for (const {pattern, templates} of SNARK_PATTERNS) {
    if (pattern.test(message)) {
      return templates[Math.floor(Math.random() * templates.length)];
    }
  }
  return "Made changes that definitely didn't need 3 sprints of planning";
}

function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL. Expected format: https://github.com/owner/repo');
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
}

function fetchCommits(owner, repo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/commits?per_page=${MAX_COMMITS}`,
      method: 'GET',
      headers: {
        'User-Agent': 'spite-changelog-generator',
        'Accept': 'application/vnd.github.v3+json',
      }
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error('Failed to parse GitHub API response'));
          }
        } else if (res.statusCode === 403) {
          reject(new Error('GitHub API rate limit exceeded. Set GITHUB_TOKEN environment variable.'));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function groupCommitsByDate(commits) {
  const groups = {};

  for (const commit of commits) {
    const date = formatDate(commit.commit.author.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(commit);
  }

  return groups;
}

function generateChangelog(owner, repo, commits) {
  const grouped = groupCommitsByDate(commits);
  const dates = Object.keys(grouped).sort().reverse();

  let changelog = `# Passive-Aggressive Changelog ✊\n\n`;
  changelog += `Generated for **${owner}/${repo}**\n\n`;
  changelog += `*Because your commit messages deserve the commentary they've been asking for.*\n\n`;
  changelog += `---\n\n`;

  for (const date of dates) {
    changelog += `## ${date}\n\n`;

    for (const commit of grouped[date]) {
      const originalMessage = commit.commit.message.split('\n')[0]; // First line only
      const snark = getSnarkForCommit(originalMessage);
      const shortSha = commit.sha.substring(0, 7);
      const author = commit.commit.author.name;

      changelog += `### ${snark}\n\n`;
      changelog += `*Original message: "${originalMessage}"*\n\n`;
      changelog += `**Author:** ${author} | **Commit:** [\`${shortSha}\`](${commit.html_url})\n\n`;
    }
  }

  changelog += `---\n\n`;
  changelog += `*This changelog was generated with maximum spite by the Passive-Aggressive Changelog Generator.*\n`;
  changelog += `*Your commits are valid. Our commentary is validating them.*\n\n`;
  changelog += `Built with ✊ for spiteprojects.com\n`;

  return changelog;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node generate-changelog.js <github-repo-url>');
    console.error('Example: node generate-changelog.js https://github.com/user/repo');
    console.error('\nOptional: Set GITHUB_TOKEN env var to avoid rate limits');
    process.exit(1);
  }

  const repoUrl = args[0];

  try {
    console.error('Parsing repository URL...');
    const {owner, repo} = parseGitHubUrl(repoUrl);

    console.error(`Fetching commits from ${owner}/${repo}...`);
    const commits = await fetchCommits(owner, repo);

    console.error(`Generating passive-aggressive changelog for ${commits.length} commits...\n`);
    const changelog = generateChangelog(owner, repo, commits);

    console.log(changelog);

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getSnarkForCommit, generateChangelog };
