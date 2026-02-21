#!/usr/bin/env node

/**
 * Spite Projects MCP Server
 *
 * A Model Context Protocol server for AI assistants to access spite project data.
 * Built with spite, for AI agents who need inspiration from rage-driven development.
 *
 * Usage:
 *   Add to Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "spiteprojects": {
 *         "command": "node",
 *         "args": ["/path/to/spiteprojects-mcp.js"]
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data loading functions (same as server.js)
function parseYamlFromMarkdown(content, sectionName) {
  const items = [];

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

function loadListings() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '../data/listings.md'), 'utf-8');
    return parseYamlFromMarkdown(content, 'Listings');
  } catch (err) {
    console.error('Failed to load listings:', err.message);
    return [];
  }
}

function loadBuilders() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '../data/builders.md'), 'utf-8');
    return parseYamlFromMarkdown(content, 'Builders');
  } catch (err) {
    console.error('Failed to load builders:', err.message);
    return [];
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'spiteprojects-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_spite_projects',
        description: 'List all spite projects from spiteprojects.com. Returns projects built out of spite against over-commercialization and unnecessary complexity. Optional: filter by label.',
        inputSchema: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
              description: 'Optional: Filter projects by label (e.g., "vibe-coding", "anti-saas", "meta")',
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of projects to return',
            },
          },
        },
      },
      {
        name: 'get_spite_score',
        description: 'Get the Spite Score and AI-generated roast for a specific project. Spite Scores range from 1-10 and measure the project\'s spitefulness, simplicity, and rage-driven excellence.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The exact name of the spite project (case-sensitive)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'get_random_project',
        description: 'Get a random spite project for inspiration. Perfect when you need a dose of spite energy or want to discover new rage-driven projects.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_projects',
        description: 'Search spite projects by name or description. Case-insensitive fuzzy search across project metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to match against project names and descriptions',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_spite_projects': {
        let listings = loadListings();

        // Filter by label if provided
        if (args.label) {
          listings = listings.filter(p => p.labels?.includes(args.label));
        }

        // Apply limit if provided
        if (args.limit && args.limit > 0) {
          listings = listings.slice(0, args.limit);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total: listings.length,
                projects: listings,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_spite_score': {
        const listings = loadListings();
        const project = listings.find(p => p.name === args.name);

        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'Project not found',
                  message: `No spite project found with name: ${args.name}`,
                  suggestion: 'Use list_spite_projects to see all available projects',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: project.name,
                spite_score: project.spite_score || null,
                spite_roast: project.spite_roast || null,
                badges: project.badges || [],
                description: project.description,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_random_project': {
        const listings = loadListings();

        if (listings.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'No projects available',
                  message: 'No spite projects found. This is concerning.',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }

        const randomIndex = Math.floor(Math.random() * listings.length);
        const project = listings[randomIndex];

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: 'Here is a random spite project to fuel your rage:',
                project,
              }, null, 2),
            },
          ],
        };
      }

      case 'search_projects': {
        const listings = loadListings();
        const query = (args.query || '').toLowerCase();

        if (!query) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'Missing query',
                  message: 'Please provide a search query',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }

        const results = listings.filter(p => {
          const nameMatch = (p.name || '').toLowerCase().includes(query);
          const descMatch = (p.description || '').toLowerCase().includes(query);
          const authorMatch = (p.author || '').toLowerCase().includes(query);
          return nameMatch || descMatch || authorMatch;
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query: args.query,
                found: results.length,
                projects: results,
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Unknown tool',
                message: `Tool "${name}" not found. Available tools: list_spite_projects, get_spite_score, get_random_project, search_projects`,
              }, null, 2),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Internal error',
            message: error.message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Spite Projects MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
