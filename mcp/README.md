# Spite Projects MCP Server

A Model Context Protocol (MCP) server for AI assistants to access spite project data directly from Claude Desktop, Cursor, or other MCP-compatible tools.

## What is MCP?

The Model Context Protocol (MCP) is a standard that allows AI assistants to interact with external data sources and tools. This MCP server gives AI assistants direct access to the Spite Projects database.

## Installation

### For Claude Desktop (macOS)

1. Install dependencies:
```bash
cd /path/to/spiteprojects-dot-com/mcp
npm install
```

2. Edit your Claude Desktop config at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

3. Add the server:
```json
{
  "mcpServers": {
    "spiteprojects": {
      "command": "node",
      "args": ["/absolute/path/to/spiteprojects-dot-com/mcp/spiteprojects-mcp.js"]
    }
  }
}
```

4. Restart Claude Desktop

### For Claude Desktop (Windows)

Config location: `%APPDATA%\Claude\claude_desktop_config.json`

### For Claude Desktop (Linux)

Config location: `~/.config/Claude/claude_desktop_config.json`

## Available Tools

Once installed, Claude will have access to these tools:

### `list_spite_projects`
List all spite projects from spiteprojects.com.

**Parameters:**
- `label` (optional): Filter by label (e.g., "vibe-coding", "anti-saas")
- `limit` (optional): Maximum number of projects to return

**Example:**
```
"Show me spite projects tagged with vibe-coding"
"List the first 5 spite projects"
```

### `get_spite_score`
Get the Spite Score and AI-generated roast for a specific project.

**Parameters:**
- `name` (required): Exact project name

**Example:**
```
"What's the spite score for spiteprojects.com?"
"Get the roast for [project name]"
```

### `get_random_project`
Get a random spite project for inspiration.

**Parameters:** None

**Example:**
```
"Give me a random spite project"
"Inspire me with some spite"
```

### `search_projects`
Search spite projects by name or description.

**Parameters:**
- `query` (required): Search term

**Example:**
```
"Search for projects about replacing SaaS"
"Find spite projects related to weekend projects"
```

## Usage Examples

Once the MCP server is installed in Claude Desktop, you can ask Claude:

- "Show me all spite projects"
- "What spite projects are tagged with 'vibe-coding'?"
- "Search for projects that replace enterprise software"
- "Give me a random spite project for inspiration"
- "What's the spite score for spiteprojects.com?"

Claude will use the MCP server to fetch live data from the local spite projects database.

## Troubleshooting

### Server not appearing in Claude Desktop

1. Check that the path in `claude_desktop_config.json` is absolute (not relative)
2. Verify the path exists: `ls -la /path/to/spiteprojects-mcp.js`
3. Check Claude Desktop logs (Help > Debug Logs)
4. Restart Claude Desktop after config changes

### Permission denied errors

Make sure the script is readable:
```bash
chmod +x /path/to/spiteprojects-mcp.js
```

### Module not found errors

Install dependencies:
```bash
cd /path/to/spiteprojects-dot-com/mcp
npm install
```

## Development

### Testing the MCP Server

You can test the server manually:

```bash
cd /path/to/spiteprojects-dot-com/mcp
npm install
node spiteprojects-mcp.js
```

The server communicates via stdio (standard input/output). Send MCP protocol messages as JSON to stdin.

### Adding New Tools

Edit `spiteprojects-mcp.js` and:

1. Add the tool definition in `ListToolsRequestSchema` handler
2. Add the tool implementation in `CallToolRequestSchema` handler
3. Update this README with the new tool documentation

## Architecture

- **Transport**: stdio (standard for MCP)
- **Data Source**: Local files (`../data/listings.md`, `../data/builders.md`)
- **Dependencies**: `@modelcontextprotocol/sdk`
- **Language**: JavaScript (ES modules)

The MCP server reads from the same data files as the web server, ensuring consistency.

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/model-context-protocol)
- [Spite Projects API Docs](https://spiteprojects.com/api.html)

---

Built with spite, for AI assistants who need inspiration. ✊
