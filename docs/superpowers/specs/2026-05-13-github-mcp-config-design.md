# Design Spec: GitHub MCP Configuration (Node.js/npx)

Date: 2026-05-13
Topic: GitHub MCP Configuration
Author: Antigravity

## 1. Overview
The user wants to configure the GitHub Model Context Protocol (MCP) server to allow the AI agent to interact with GitHub repositories. The initial attempt using Docker failed due to disk space constraints on the root partition (`/`). The new design switches to a Node.js-based execution using `npx`, which utilizes the user's home partition (`/home`) where space is abundant.

## 2. Architecture
The GitHub MCP server will be executed as a child process by the IDE/Agent host.
- **Runtime**: Node.js (already installed: v26.1.0)
- **Execution Tool**: `npx`
- **MCP Server Package**: `@modelcontextprotocol/server-github`

## 3. Configuration Details
The configuration file is located at `/home/Archux/.gemini/antigravity/mcp_config.json`.

### 3.1. Target JSON Structure
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

## 4. Implementation Steps
1. **Backup**: (Implicitly handled by viewing the file previously).
2. **File Update**: Overwrite `/home/Archux/.gemini/antigravity/mcp_config.json` with the new configuration.
3. **Restart/Reload**: The user may need to restart the IDE or reload plugins for changes to take effect.
4. **Verification**: Test the connection by listing repositories or checking server status.

## 5. Risk Assessment
- **Token Validity**: If the existing token is expired or has insufficient scopes (needs `repo` or `public_repo`), the server will fail to authenticate.
- **Node.js Version**: v26.1.0 is very recent and should be compatible, but we will monitor for any runtime issues.
- **Network**: Requires internet access to download the `@modelcontextprotocol/server-github` package via `npx` on the first run.
