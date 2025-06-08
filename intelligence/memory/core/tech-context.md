# Technical Context

This document outlines the technical stack and key technologies used in the Roo Code Intelligence Server.

**Programming Language:** TypeScript
**Runtime Environment:** Node.js
**Core Protocol:** Model Context Protocol (MCP) SDK
**Package Manager:** npm

**Key Libraries/Frameworks:**
- `@modelcontextprotocol/sdk`: For MCP server implementation and communication.
- `yaml`: For parsing and loading YAML configuration files.
- `chokidar`: For efficient file watching (VS Code integration).
- `fs-extra`: For extended file system operations.
- `eslint`: For static code analysis and quality checks.
- `typescript`: For type checking and diagnostics.
- `jest`: For unit and integration testing.
- `serpapi`: For external web search integration.

**Architecture:**
The server is designed with a modular architecture, where each core functionality (e.g., code analysis, memory management, web search) is encapsulated as a distinct MCP tool. These tools are orchestrated by a master workflow to perform complex tasks.

**Configuration:**
The server's behavior is highly configurable via a YAML file (`.roo/code-intelligence.yaml`), allowing for dynamic adjustment of integration settings, memory management rules, and priority levels.