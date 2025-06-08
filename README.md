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

## 🔧 Available Tools

The Roo Code Intelligence server provides the following tools:

-   `roo_code_workflow`: To execute the full analysis workflow (Inspection, Diagnosis, Execution).
-   `code_intelligence_analyze`: The three-phase code analysis engine.
-   `web_search_enhanced`: SerpAPI integration for web search with caching.
-   `memory_bank_manager`: Structured memory file management system with automatic archiving.
-   `eslint_analysis`: Code quality analysis tool using ESLint with auto-fix capabilities.
-   `typescript_diagnostics`: TypeScript type checking and diagnostics tool.
-   `daily_digest_generator`: Generates a daily summary of completed tasks, key decisions, errors, and deadlines.
-   `context_condensing`: Condenses context based on priority and compression rate.

## 💡 Usage Examples (via MCP Client)

Once your MCP client is configured, you can call the server's tools. Here are some code examples (using the MCP SDK):

```typescript
import { MCPClient } from "@modelcontextprotocol/sdk";

// Create an MCP client to connect to the local server
// If the server is running locally via StdioServerTransport, you might not need serverUrl
// But if you are using a hosted server via HTTP/HTTPS, you will need to specify serverUrl
const client = new MCPClient({
    serverName: "roo-code-intelligence" // This must match the server name in the client configuration
});

// Example 1: Full code analysis for a file
await client.call("roo_code_workflow", {
  workflow_type: "full_analysis",
  target_files: ["src/auth.ts", "src/types.ts"],
  include_web_search: true
});

// Example 2: Quick ESLint check
await client.call("eslint_analysis", {
  file_path: "src/components/Header.tsx",
  auto_fix: true
});

// Example 3: Context Condensing
await client.call("context_condensing", {
  target_files: ["src/utils/large-log.ts"],
  compression_rate: 0.5
});

// Example 4: Generate Daily Digest
await client.call("daily_digest_generator", {});

// Example 5: Web search for solutions
await client.call("web_search_enhanced", {
  query: "TypeScript interface extends generic constraint",
  search_type: "documentation",
  max_results: 5
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