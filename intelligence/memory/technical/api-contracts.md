# API Contracts

This document defines the API contracts for external services and internal MCP tools used by the Roo Code Intelligence Server.

## External API Contracts

### 1. SerpAPI
- **Endpoint:** `https://serpapi.com/search`
- **Method:** `GET` (or `POST` if using a client library that abstracts it)
- **Authentication:** API Key (via `SERP_API_KEY` environment variable or `config.integrations.serpapi.api_key`)
- **Request Parameters:**
    - `q` (string, required): Search query.
    - `api_key` (string, required): Your SerpAPI key.
    - `num` (number, optional): Number of results to return (default: 10).
    - `engine` (string, optional): Search engine (e.g., `google`, `bing`).
- **Response Structure (simplified):**
    ```json
    {
      "search_parameters": { ... },
      "organic_results": [
        {
          "title": "...",
          "link": "...",
          "snippet": "...",
          "source": "..."
        },
        // ... more results
      ],
      "related_searches": [ ... ],
      // ... other fields
    }
    ```

## Internal MCP Tool Contracts

### 1. `code_intelligence_analyze`
- **Description:** Three-phase code analysis: Inspection → Diagnosis → Execution.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "phase": { "type": "string", "enum": ["inspection", "diagnosis", "execution", "all"] },
        "file_path": { "type": "string" },
        "context_files": { "type": "array", "items": { "type": "string" } },
        "priority_level": { "type": "string", "enum": ["P0", "P1", "P2"] }
      },
      "required": ["phase", "file_path"]
    }
    ```
- **Output Schema (varies by phase):**
    - `InspectionResult`: `fileContent`, `ast`, `metrics`
    - `DiagnosisResult`: `errors`, `warnings`, `suggestions`
    - `ExecutionResult`: `solutions`, `priority`

### 2. `memory_bank_manager`
- **Description:** Manage structured memory files with auto-archiving.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["read", "write", "update", "archive", "search"] },
        "file_category": { "type": "string", "enum": ["core", "dynamic", "planning", "technical", "auto_generated"] },
        "file_name": { "type": "string" },
        "content": { "type": "string" },
        "search_query": { "type": "string" }
      },
      "required": ["action", "file_category"]
    }
    ```
- **Output Schema (varies by action):**
    - `read`: `{ content: string }`
    - `write`: `{ success: boolean, path: string }`
    - `update`: `{ success: boolean, timestamp: string }`
    - `archive`: `{ archived: Array<{ file: string, archived: string }> }`
    - `search`: `{ results: Array<{ file: string, category: string }> }`

### 3. `web_search_enhanced`
- **Description:** Enhanced web search with result caching and context integration.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "query": { "type": "string" },
        "search_type": { "type": "string", "enum": ["general", "code", "documentation", "error_solution"] },
        "max_results": { "type": "number", "default": 10 }
      },
      "required": ["query", "search_type"]
    }
    ```
- **Output Schema:** `{ type: string, results: Array<any> }`

### 4. `sequential_thinking_process`
- **Description:** Step-by-step problem solving with decision trees.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "problem_statement": { "type": "string" },
        "thinking_depth": { "type": "number", "default": 3 },
        "include_alternatives": { "type": "boolean", "default": true }
      },
      "required": ["problem_statement"]
    }
    ```
- **Output Schema:** `{ status: string, message: string, problem_statement: string, thinking_depth: number, include_alternatives: boolean, steps: string[], decisions: string[], alternatives: string[] }`

### 5. `eslint_analysis`
- **Description:** Code quality analysis with auto-fix capabilities.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "file_path": { "type": "string" },
        "auto_fix": { "type": "boolean", "default": false },
        "rules_override": { "type": "object", "additionalProperties": true }
      },
      "required": ["file_path"]
    }
    ```
- **Output Schema:** `{ results: Array<any>, summary: { totalErrors: number, totalWarnings: number, filesAnalyzed: number } }`

### 6. `typescript_diagnostics`
- **Description:** TypeScript type checking and diagnostics.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "file_path": { "type": "string" },
        "check_type": { "type": "string", "enum": ["syntax", "semantic", "all"] },
        "include_suggestions": { "type": "boolean", "default": true }
      },
      "required": ["file_path", "check_type"]
    }
    ```
- **Output Schema:** `{ diagnostics: { errors: Array<any>, warnings: Array<any>, suggestions: Array<any> }, summary: { errorCount: number, warningCount: number, suggestionCount: number } }`

### 7. `roo_code_workflow`
- **Description:** Execute complete Roo Code Intelligence workflow.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "workflow_type": { "type": "string", "enum": ["full_analysis", "quick_check", "context_condensing", "daily_digest"] },
        "target_files": { "type": "array", "items": { "type": "string" } },
        "priority_override": { "type": "string", "enum": ["P0", "P1", "P2"] },
        "include_web_search": { "type": "boolean", "default": false }
      },
      "required": ["workflow_type", "target_files"]
    }
    ```
- **Output Schema (varies by workflow_type):**
    - `full_analysis`: `{ inspection: any, diagnosis: any, execution: any, external_tools: any }`
    - `quick_check`: `{ eslint: any, typescript: any, summary: any }`
    - `context_condensing`: `{ condensed: boolean, files: string[], results: Array<any> }`
    - `daily_digest`: `{ generated: boolean, timestamp: string, message: string }`

### 8. `daily_digest_generator`
- **Description:** Generates a daily summary of completed tasks, key decisions, errors, and deadlines.
- **Input Schema:** `{}`
- **Output Schema:** `{ generated: boolean, timestamp: string, message: string }`

### 9. `context_condensing_process`
- **Description:** Condenses context from specified files based on a compression rate.
- **Input Schema:**
    ```json
    {
      "type": "object",
      "properties": {
        "target_files": { "type": "array", "items": { "type": "string" } },
        "compression_rate": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 }
      },
      "required": ["target_files"]
    }
    ```
- **Output Schema:** `{ status: string, message: string, results: Array<any> }`