# intelligence-mcp

# MCP Server Usage Guide for AI (Roo Code Intelligence)

## 🎯 Project Overview

This project is an integrated MCP (Model Context Protocol) server designed to provide advanced AI capabilities for code analysis. The server integrates multiple specialized tools and follows a three-phase analysis workflow (Inspection → Diagnosis → Execution) to deliver comprehensive code insights and solutions.

## 🚀 Prerequisites

Ensure the following software is installed on your system:

-   **Node.js**: Version 18 or later.
-   **npm**: Node.js package manager (comes with Node.js).
-   **Git**: For cloning the repository.

## 🛠️ Installation and Setup Steps

Follow these steps to set up and run the server locally:

1.  **Clone the Repository**:
    Open your terminal and clone the repository:
    ```bash
    git clone https://github.com/yourusername/intelligence-mcp.git
    cd intelligence-mcp
    ```

2.  **Install Dependencies**:
    Navigate to the project directory and install all necessary dependencies:
    ```bash
    npm install
    ```

3.  **Build the Project**:
    Build the TypeScript project to transpile source code into executable JavaScript:
    ```bash
    npm run build
    ```

4.  **Configure `.roo/code-intelligence.yaml`**:
    The server uses a YAML configuration file to manage settings. Ensure that `.roo/code-intelligence.yaml` exists in the project root. If not, you can create it with the following content (or modify an existing one):

    ```yaml
    version: 2.0
    memory:
      enabled: true
      files:
        core: []
        dynamic: []
        planning: []
        technical: []
        auto_generated: []
      archive:
        path: "archive/"
        retention_period: "30d"
    priorities:
      P0: [code_modifications, handover_decisions]
      P1: [memory_bank_updates, critical_conflicts]
      P2: [general_discussion]
    integrations:
      serpapi:
        api_key: "" # This key should be set from environment variables or GitHub secrets
        rate_limit: 100
        cache_duration: "1h"
      eslint:
        config_path: ".eslintrc.js"
        auto_fix: true
        severity_threshold: "warning"
      typescript:
        tsconfig_path: "tsconfig.json"
        check_on_save: true
        diagnostic_level: "error"
    ```
    **Note**: For `serpapi.api_key`, it is recommended to use environment variables (e.g., `SERP_API_KEY` in a `.env` file) or GitHub secrets instead of embedding it directly in this file for security reasons.

5.  **Set Environment Variables (`.env`)**:
    To set your SerpAPI key and any other environment variables, create a `.env` file in the project root (if it doesn't exist) and add the following variables:

    ```dotenv
    SERP_API_KEY=your_serp_api_key_here
    # You can add other environment variables here if needed
    ```
    **Make sure to replace `your_serp_api_key_here` with your actual API key.**

## 🖥️ Running the Server Locally

After completing the installation steps, you can run the server:

1.  **Start the Server**:
    ```bash
    npm run start
    ```
    This command will run the server in production mode. You will see a message in the terminal indicating that the server has started successfully.

2.  **Run the Server with Watch (for Development)**:
    If you are developing and want the server to restart automatically when changes are saved, use:
    ```bash
    npm run watch
    ```

## 🔌 Integrating the Server with an MCP Client (e.g., VS Code)

To make the server "online" or interact with a development environment like VS Code, you need to configure an MCP client (such as the Claude Desktop extension or any MCP-enabled extension) to connect to your local server.

### Example VS Code Configuration (using an MCP-enabled extension):

Typically, MCP extensions require configuration in a JSON file (e.g., `~/.claude-desktop/claude_desktop_config.json` or VS Code user settings). You will need to add an entry for your server.

Here's an example of how to configure your server in a `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "roo-code-intelligence": {
      "serverUrl": "https://intelligence-mcp.onrender.com"
    }
  }
}
```
**Note**: If the MCP client connects via `StdioServerTransport` (standard input/output), a `serverUrl` might not be explicitly needed in the client configuration, as the client directly spawns and communicates with the server process. However, for HTTP/HTTPS connections, `serverUrl` is essential.

## 🔧 Available Tools and Detailed Usage

The Roo Code Intelligence server provides a suite of powerful tools designed to enhance your AI's capabilities in code analysis and project management. Each tool is accessible via the MCP client.

### 1. `code_intelligence_analyze`
**Description**: The core three-phase code analysis engine: Inspection → Diagnosis → Execution.
**Features**:
-   **Inspection Phase**: Analyzes file structure, extracts metrics (e.g., complexity, dependencies), and builds an Abstract Syntax Tree (AST).
-   **Diagnosis Phase**: Identifies potential issues (errors, warnings, suggestions) based on code patterns, type inconsistencies, and logic flaws.
-   **Execution Phase**: Proposes solutions, refactoring suggestions, or bug fixes based on the diagnosis.
**Usage Example**:
```typescript
await client.call("code_intelligence_analyze", {
  phase: "all", // Can be "inspection", "diagnosis", "execution", or "all"
  file_path: "src/services/auth.ts",
  context_files: ["src/types/user.d.ts", "src/config.ts"], // Optional: provide additional context files
  priority_level: "P0" // Optional: "P0", "P1", "P2"
});
```

### 2. `web_search_enhanced`
**Description**: Enhanced web search with result caching and context integration, powered by SerpAPI.
**Features**:
-   **Targeted Search**: Supports general, code, documentation, and error solution search types.
-   **Caching**: Caches search results to reduce API calls and improve response times.
**Usage Example**:
```typescript
await client.call("web_search_enhanced", {
  query: "TypeScript interface extends generic constraint",
  search_type: "documentation", // Can be "general", "code", "documentation", "error_solution"
  max_results: 5 // Optional: number of results to fetch
});
```

### 3. `memory_bank_manager`
**Description**: Structured memory file management system with automatic archiving.
**Features**:
-   **Read/Write/Update**: Perform CRUD operations on memory files categorized into `core`, `dynamic`, `planning`, `technical`, and `auto_generated`.
-   **Archiving**: Automatically archives old memory entries based on retention policies.
-   **Search**: Search for content within memory files.
**Usage Examples**:
-   **Write to a memory file**:
    ```typescript
    await client.call("memory_bank_manager", {
      action: "write",
      file_category: "dynamic", // e.g., "core", "dynamic", "planning", "technical", "auto_generated"
      file_name: "active-context.md",
      content: "New task: Implement user authentication module. [STATUS: In-Progress]"
    });
    ```
-   **Read from a memory file**:
    ```typescript
    await client.call("memory_bank_manager", {
      action: "read",
      file_category: "core",
      file_name: "project-brief.md"
    });
    ```
-   **Search memory files**:
    ```typescript
    await client.call("memory_bank_manager", {
      action: "search",
      file_category: "technical",
      search_query: "API endpoint"
    });
    ```
-   **Archive files in a category**:
    ```typescript
    await client.call("memory_bank_manager", {
      action: "archive",
      file_category: "auto_generated"
    });
    ```

### 4. `eslint_analysis`
**Description**: Code quality analysis tool using ESLint with auto-fix capabilities.
**Features**:
-   **Linting**: Analyzes JavaScript/TypeScript files for code quality issues.
-   **Auto-Fix**: Automatically fixes fixable issues based on ESLint rules.
-   **Configurable Severity**: Filter results by severity threshold.
**Usage Example**:
```typescript
await client.call("eslint_analysis", {
  file_path: "src/components/Header.tsx",
  auto_fix: true, // Optional: set to true to attempt auto-fixing
  rules_override: { // Optional: override specific ESLint rules
    "no-unused-vars": "off"
  }
});
```

### 5. `typescript_diagnostics`
**Description**: TypeScript type checking and diagnostics tool.
**Features**:
-   **Syntax/Semantic Checks**: Perform syntax-only or full semantic checks.
-   **Diagnostic Levels**: Filter diagnostics by error, warning, or suggestion levels.
**Usage Example**:
```typescript
await client.call("typescript_diagnostics", {
  file_path: "src/utils/helpers.ts",
  check_type: "all", // Can be "syntax", "semantic", or "all"
  include_suggestions: true // Optional: include suggestions in the results
});
```

### 6. `sequential_thinking_process`
**Description**: Step-by-step problem solving with decision trees.
**Features**:
-   **Structured Reasoning**: Breaks down complex problems into manageable steps.
-   **Alternative Consideration**: Can include alternative solutions in its reasoning process.
**Usage Example**:
```typescript
await client.call("sequential_thinking_process", {
  problem_statement: "How to refactor the user authentication flow for scalability?",
  thinking_depth: 5, // Optional: depth of the thinking process
  include_alternatives: true // Optional: include alternative solutions
});
```

### 7. `daily_digest_generator`
**Description**: Generates a daily summary of completed tasks, key decisions, errors, and deadlines.
**Features**:
-   **Automated Reporting**: Compiles information from various memory files into a concise daily digest.
**Usage Example**:
```typescript
await client.call("daily_digest_generator", {});
```

### 8. `context_condensing`
**Description**: Condenses context based on priority and compression rate.
**Features**:
-   **Intelligent Summarization**: Prioritizes information based on configured rules and compresses it to a specified rate.
**Usage Example**:
```typescript
await client.call("context_condensing", {
  target_files: ["src/utils/large-log.ts", "src/data/metrics.json"],
  compression_rate: 0.5 // Optional: target compression rate (0.0 to 1.0)
});
```

## API Endpoints

### Streaming Tool Endpoint (POST /api/tool)
For clients that support Server-Sent Events (SSE). Requires Accept header to include both `application/json` and `text/event-stream`.

### Simple Tool Endpoint (POST /api/tool-simple) 
For standard HTTP clients that don't support streaming. Only requires Accept header to include `application/json`.

Example using fetch:
```javascript
const response = await fetch('http://your-server/api/tool-simple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    tool: 'your_tool_name',
    args: { /* tool arguments */ }
  })
});
```

## ⚠️ Common Troubleshooting

-   **Connection Issues**:
    -   Ensure the server is running (check the terminal where you ran `npm run start`).
    -   Ensure the `cwd` path in your MCP client configuration is correct and points to your project root.
    -   Ensure the server name (`"roo-code-intelligence"`) in the client configuration matches the name specified in `src/index.ts`.
-   **TypeScript Issues**:
    -   Ensure a correct `tsconfig.json` file exists in the project root.
    -   Ensure `tsconfig_path` in `.roo/code-intelligence.yaml` points to the correct path.
-   **ESLint Issues**:
    -   Check for a `.eslintrc.cjs` or `.eslintrc.js` file in the project root.
    -   Ensure `config_path` in `.roo/code-intelligence.yaml` points to the correct path.
-   **SerpAPI Issues**:
    -   Ensure `SERP_API_KEY` is correctly set in your `.env` file or in the environment variables of your MCP client configuration.

## ☁️ Hosting the Server Online

You can host this server on various cloud platforms to make it accessible online. Here are some common options:

### 1. Hosting on Railway

-   Create an account on [Railway](https://railway.app).
-   Connect your GitHub account to your repository.
-   Railway will automatically detect your Node.js project and deploy it.

### 2. Hosting on Render

-   Create an account on [Render](https://render.com).
-   Choose "New Web Service" and connect your GitHub repository.
-   Set build and start commands:
    ```
    Build Command: npm install && npm run build
    Start Command: npm start
    ```

### 3. Hosting on Heroku

-   Create an account on [Heroku](https://heroku.com).
-   Install the Heroku CLI.
-   Upload the project using Git:
    ```bash
    heroku create your-mcp-server-name # Replace with your chosen name
    git push heroku main
    ```

### Important Notes for Online Hosting:

-   **Environment Variables**: Ensure all required environment variables (like `SERP_API_KEY`) are set on the hosting platform.
-   **Server Configuration**: You might need to modify the `.roo/code-intelligence.yaml` configuration file or server logic (especially in `src/index.ts`) to use `HttpServerTransport` instead of `StdioServerTransport` if you are hosting it as a standard web service.
-   **CORS**: If you will be connecting to the server from different domains (e.g., a frontend web application), you will need to enable CORS (Cross-Origin Resource Sharing) on the server.
-   **HTTPS**: Always use HTTPS for secure connections to the hosted server.

After hosting, you will get a server URL (example: `https://your-server-url.com`). You can then configure your MCP client to connect to this address:

```typescript
import { MCPClient } from "@modelcontextprotocol/sdk";

const client = new MCPClient({
    serverUrl: "https://your-server-url.com" // Your server URL after hosting
});

// Now you can use the server from anywhere
await client.call("typescript_diagnostics", {
    file_path: "src/main.ts",
    check_type: "all"
});
```

## 🤝 Contributing to the Project

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`
3.  Make your changes and commit them: `git commit -m "feat: Add new feature"`
4.  Push the branch to your fork: `git push origin feature/your-feature-name`
5.  Open a Pull Request to the main branch of the project.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.