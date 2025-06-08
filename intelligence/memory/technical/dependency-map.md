# Dependency Map

This document outlines the key dependencies and their relationships within the Roo Code Intelligence Server.

**Core Dependencies:**
- `@modelcontextprotocol/sdk`: Fundamental for MCP server functionality.
- `Node.js`: Runtime environment.
- `TypeScript`: Primary development language.

**Tool-Specific Dependencies:**
- `serpapi`: Used by `web_search_enhanced` tool for external web searches.
- `eslint`: Used by `eslint_analysis` tool for code quality checks.
- `typescript` (as a library): Used by `typescript_diagnostics` tool for type checking.
- `yaml`: Used by `config-loader.ts` for configuration parsing.
- `chokidar`: Planned for `file-watcher.ts` (future implementation for VS Code integration).
- `fs-extra`: Used for extended file system operations, particularly in `memory-bank.ts`.

**Internal Module Dependencies:**
- `src/index.ts` depends on `src/utils/config-loader.ts`, `src/tools/index.ts`, `src/utils/error-handler.ts`, `src/utils/logger.ts`.
- `src/tools/index.ts` depends on all individual tool definition files (e.g., `code-intelligence.ts`, `memory-bank.ts`, `serpapi.ts`, `eslint-integration.ts`, `typescript-integration.ts`, `sequential-thinking.ts`, `master-workflow.ts`, `daily-digest.ts`, `context-condensing.ts`).
- `src/workflows/master-workflow.ts` depends on `code_intelligence_analyze`, `web_search_enhanced`, `eslint_analysis`, `typescript_diagnostics`, `memory_bank_manager`, `daily_digest_generator`, `context_condensing_process` tools via `context.call`.
- `src/tools/memory-bank.ts` depends on `fs/promises` and `path`.
- `src/workflows/daily-digest.ts` depends on `memory_bank_manager` tool via `context.call`.
- `src/workflows/context-condensing.ts` depends on `memory_bank_manager` tool via `context.call`.

**External API Dependencies:**
- `SerpAPI`: For web search functionality.

**Dependency Management:**
- `package.json` defines all project dependencies and devDependencies.
- `npm` is used for package installation and management.