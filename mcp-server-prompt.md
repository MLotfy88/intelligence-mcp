
إليك الـ prompt الجاهز لـ GitHub Copilot لإنشاء MCP Server كاملاً:

```
Create a complete MCP (Model Context Protocol) Server for "Roo Code Intelligence" with the following specifications:

## Project Setup
- Create package.json with MCP SDK dependencies (@modelcontextprotocol/sdk, yaml, chokidar, fs-extra)
- Setup TypeScript configuration with ES2022 target and ESNext modules
- Create proper folder structure: src/{tools,workflows,utils,types}, config/, .github/workflows/

## Core MCP Server Implementation
Create src/index.ts as main MCP server with:
- Server initialization with name "roo-code-intelligence" version "2.1.0"
- StdioServerTransport connection
- Tool registration and request handlers for ListTools and CallTool
- Error handling and logging

## Required Tools (implement each in separate files):

### 1. roo_code_workflow tool (src/workflows/master-workflow.ts)
- Execute complete analysis workflow
- Input: workflow_type (full_analysis, quick_check, context_condensing, daily_digest), target_files[], priority_override, include_web_search
- Implement three-phase analysis: Inspection → Diagnosis → Execution
- Integrate all other tools in workflow

### 2. code_intelligence_analyze tool (src/tools/code-intelligence.ts)
- Three-phase code analysis engine
- Input: phase (inspection/diagnosis/execution/all), file_path, context_files[], priority_level
- File reading, AST parsing, error detection, solution generation

### 3. web_search_enhanced tool (src/tools/serpapi.ts)
- SerpAPI integration with caching
- Input: query, search_type (general/code/documentation/error_solution), max_results
- Use API key: " use github secrets 'SERP_API_KEY' "
- Implement result caching with 1-hour expiration

### 4. memory_bank_manager tool (src/tools/memory-bank.ts)
- Structured file management system
- Input: action (read/write/update/archive/search), file_category, file_name, content, search_query
- Categories: core, dynamic, planning, technical, auto_generated
- Auto-archiving with timestamps

### 5. eslint_analysis tool (src/tools/eslint-integration.ts)
- Code quality analysis
- Input: file_path, auto_fix, rules_override
- ESLint integration with configurable rules

### 6. typescript_diagnostics tool (src/tools/typescript-integration.ts)
- TypeScript type checking
- Input: file_path, check_type (syntax/semantic/all), include_suggestions
- TSServer integration for diagnostics

## Configuration System
Create src/utils/config-loader.ts to load YAML config from .roo/code-intelligence.yaml with structure:
```yaml
version: 2.0
memory:
  enabled: true
  files: {core: [], dynamic: [], planning: [], technical: [], auto_generated: []}
  archive: {path: "archive/", retention_period: "30d"}
priorities:
  P0: [code_modifications, handover_decisions]
  P1: [memory_bank_updates, critical_conflicts]
  P2: [general_discussion]
integrations:
  serpapi: {api_key: "", rate_limit: 100, cache_duration: "1h"}
  eslint: {config_path: ".eslintrc.js", auto_fix: true}
  typescript: {tsconfig_path: "tsconfig.json", check_on_save: true}
```

## Additional Requirements:
- Create comprehensive README.md with installation, setup, and usage instructions
- Add GitHub Actions workflow (.github/workflows/ci.yml) for CI/CD
- Include proper TypeScript types (src/types/)
- Add error handling and logging throughout
- Create .env.example for environment variables
- Setup proper .gitignore for Node.js project
- Add Jest testing configuration
- Include ESLint configuration

## Key Features to Implement:
- Three-phase analysis workflow (Inspection → Diagnosis → Execution)
- Memory bank with structured file organization
- Context condensing with priority-based compression
- Web search integration with result caching
- Code quality analysis (ESLint + TypeScript)
- File watching for VS Code integration
- Conflict resolution system
- Daily digest generation

Make it production-ready with proper error handling, logging, and documentation. The server should be compatible with Claude Desktop and other MCP clients.
```

---

**للاستخدام:**
1. اذهب إلى GitHub.com
2. انشئ repository جديد 
3. افتح GitHub Copilot Chat
4. انسخ والصق الـ prompt أعلاه
5. اطلب من Copilot إنشاء الملفات تدريجياً

**أو يمكنك استخدام هذا الـ prompt المختصر:**

```
Using GitHub Copilot, create a complete MCP Server project called "roo-code-intelligence-mcp" with:

1. Full TypeScript/Node.js setup with @modelcontextprotocol/sdk
2. 6 main tools: roo_code_workflow, code_intelligence_analyze, web_search_enhanced (SerpAPI), memory_bank_manager, eslint_analysis, typescript_diagnostics  
3. Three-phase analysis system (Inspection→Diagnosis→Execution)
4. YAML configuration loader for .roo/code-intelligence.yaml
5. Structured memory bank with auto-archiving
6. SerpAPI integration with key: use GitHub secrets "SERP_API_KEY"
7. GitHub Actions CI/CD pipeline
8. Complete documentation and setup instructions

Generate all necessary files with proper structure, error handling, and MCP protocol compliance.
```

هذا الـ prompt سيجعل GitHub Copilot ينشئ المشروع كاملاً بشكل تلقائي مع جميع المتطلبات المذكورة سابقاً.

------------- امثلة مرجعية -----------



سأقوم بإنشاء prompt شامل لبناء MCP Server مخصص يدمج جميع التحسينات المطلوبة:

```markdown
# MCP Server Development Prompt: Roo Code Intelligence Server

## 🎯 Project Overview
Create a comprehensive Model Context Protocol (MCP) Server that implements the enhanced AI code intelligence system for Gemini 2.5 Flash, integrating multiple specialized tools and maintaining the three-phase analysis workflow (Inspection → Diagnosis → Execution).

## 🏗️ Core Architecture Requirements

### 1. **Primary MCP Server Structure**
```typescript
// src/index.ts - Main MCP Server Entry Point
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

interface RooCodeIntelligenceServer {
  // Core Intelligence Engine
  codeIntelligence: CodeIntelligenceEngine;
  
  // Memory Management System
  memoryBank: MemoryBankManager;
  
  // Context Condensing Protocol
  contextCondenser: ContextCondensingEngine;
  
  // External Tool Integrations
  serpAPI: SerpAPIIntegration;
  sequentialThinking: SequentialThinkingMCP;
  eslint: ESLintMCPIntegration;
  typescript: TypeScriptServerIntegration;
}
```

### 2. **Configuration Integration**
```yaml
# Load from .roo/code-intelligence.yaml
server:
  name: "roo-code-intelligence"
  version: "2.1.0"
  description: "Enhanced AI Code Intelligence Server with Multi-Tool Integration"
  
integrations:
  serpapi:
    api_key: "SERP_API_KEY"
    rate_limit: 100  # requests per hour
    cache_duration: 1h
  
  sequential_thinking:
    enabled: true
    max_depth: 5
    timeout: 30s
  
  eslint:
    config_path: ".eslintrc.js"
    auto_fix: true
    severity_threshold: "warning"
  
  typescript:
    tsconfig_path: "tsconfig.json"
    check_on_save: true
    diagnostic_level: "error"
```

## 🔧 Core Tools Implementation

### Tool 1: **Code Intelligence Engine**
```typescript
interface CodeIntelligenceTool {
  name: "code_intelligence_analyze";
  description: "Three-phase code analysis: Inspection → Diagnosis → Execution";
  inputSchema: {
    type: "object";
    properties: {
      phase: { enum: ["inspection", "diagnosis", "execution", "all"] };
      file_path: { type: "string" };
      context_files: { type: "array"; items: { type: "string" } };
      priority_level: { enum: ["P0", "P1", "P2"] };
    };
  };
}

// Implementation
async function executeCodeIntelligence(args: CodeIntelligenceArgs) {
  const config = await loadYAMLConfig('.roo/code-intelligence.yaml');
  
  switch (args.phase) {
    case 'inspection':
      return await inspectionPhase(args, config);
    case 'diagnosis':
      return await diagnosisPhase(args, config);
    case 'execution':
      return await executionPhase(args, config);
    case 'all':
      return await fullAnalysisPipeline(args, config);
  }
}
```

### Tool 2: **Memory Bank Manager**
```typescript
interface MemoryBankTool {
  name: "memory_bank_manager";
  description: "Manage structured memory files with auto-archiving";
  inputSchema: {
    type: "object";
    properties: {
      action: { enum: ["read", "write", "update", "archive", "search"] };
      file_category: { enum: ["core", "dynamic", "planning", "technical", "auto_generated"] };
      file_name: { type: "string" };
      content: { type: "string" };
      search_query: { type: "string" };
    };
  };
}

async function executeMemoryBank(args: MemoryBankArgs) {
  const memoryConfig = config.memory;
  
  switch (args.action) {
    case 'read':
      return await readMemoryFile(args.file_category, args.file_name, memoryConfig);
    case 'write':
      return await writeMemoryFile(args.file_category, args.file_name, args.content, memoryConfig);
    case 'update':
      return await updateWithTimestamp(args.file_category, args.file_name, args.content);
    case 'archive':
      return await archiveOldFiles(memoryConfig.archive);
    case 'search':
      return await searchMemoryBank(args.search_query, memoryConfig);
  }
}
```

### Tool 3: **SerpAPI Integration**
```typescript
interface SerpAPITool {
  name: "web_search_enhanced";
  description: "Enhanced web search with result caching and context integration";
  inputSchema: {
    type: "object";
    properties: {
      query: { type: "string" };
      search_type: { enum: ["general", "code", "documentation", "error_solution"] };
      max_results: { type: "number"; default: 10 };
      include_context: { type: "boolean"; default: true };
    };
  };
}

async function executeSerpAPI(args: SerpAPIArgs) {
  const serpConfig = config.integrations.serpapi;
  
  // Check cache first
  const cachedResult = await getCachedResult(args.query);
  if (cachedResult && !isExpired(cachedResult)) {
    return cachedResult;
  }
  
  // Make API call
  const response = await fetch('https://serpapi.com/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serpConfig.api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: args.query,
      engine: 'google',
      num: args.max_results
    })
  });
  
  const results = await response.json();
  
  // Cache and return
  await cacheResult(args.query, results, serpConfig.cache_duration);
  return formatSearchResults(results, args.search_type);
}
```

### Tool 4: **Sequential Thinking Integration**
```typescript
interface SequentialThinkingTool {
  name: "sequential_thinking_process";
  description: "Step-by-step problem solving with decision trees";
  inputSchema: {
    type: "object";
    properties: {
      problem_statement: { type: "string" };
      thinking_depth: { type: "number"; default: 3 };
      include_alternatives: { type: "boolean"; default: true };
    };
  };
}

async function executeSequentialThinking(args: SequentialThinkingArgs) {
  const thinkingConfig = config.integrations.sequential_thinking;
  
  return await sequentialThinkingMCP.process({
    problem: args.problem_statement,
    max_depth: Math.min(args.thinking_depth, thinkingConfig.max_depth),
    timeout: thinkingConfig.timeout,
    include_alternatives: args.include_alternatives
  });
}
```

### Tool 5: **ESLint Integration**
```typescript
interface ESLintTool {
  name: "eslint_analysis";
  description: "Code quality analysis with auto-fix capabilities";
  inputSchema: {
    type: "object";
    properties: {
      file_path: { type: "string" };
      auto_fix: { type: "boolean"; default: false };
      rules_override: { type: "object" };
    };
  };
}

async function executeESLint(args: ESLintArgs) {
  const eslintConfig = config.integrations.eslint;
  
  const lintResult = await eslintMCP.analyze({
    filePath: args.file_path,
    configPath: eslintConfig.config_path,
    autoFix: args.auto_fix && eslintConfig.auto_fix,
    rulesOverride: args.rules_override
  });
  
  // Filter by severity threshold
  const filteredResults = lintResult.filter(
    issue => issue.severity >= eslintConfig.severity_threshold
  );
  
  return {
    issues: filteredResults,
    fixable: filteredResults.filter(issue => issue.fixable),
    summary: generateLintSummary(filteredResults)
  };
}
```

### Tool 6: **TypeScript Server Integration**
```typescript
interface TypeScriptTool {
  name: "typescript_diagnostics";
  description: "TypeScript type checking and diagnostics";
  inputSchema: {
    type: "object";
    properties: {
      file_path: { type: "string" };
      check_type: { enum: ["syntax", "semantic", "all"] };
      include_suggestions: { type: "boolean"; default: true };
    };
  };
}

async function executeTypeScript(args: TypeScriptArgs) {
  const tsConfig = config.integrations.typescript;
  
  const diagnostics = await typescriptServer.getDiagnostics({
    filePath: args.file_path,
    configPath: tsConfig.tsconfig_path,
    checkType: args.check_type,
    minSeverity: tsConfig.diagnostic_level
  });
  
  return {
    errors: diagnostics.filter(d => d.severity === 'error'),
    warnings: diagnostics.filter(d => d.severity === 'warning'),
    suggestions: args.include_suggestions ? diagnostics.filter(d => d.severity === 'suggestion') : [],
    summary: generateTypeScriptSummary(diagnostics)
  };
}
```

## 🔄 Workflow Integration

### **Master Workflow Tool**
```typescript
interface MasterWorkflowTool {
  name: "roo_code_workflow";
  description: "Execute complete Roo Code Intelligence workflow";
  inputSchema: {
    type: "object";
    properties: {
      workflow_type: { enum: ["full_analysis", "quick_check", "context_condensing", "daily_digest"] };
      target_files: { type: "array"; items: { type: "string" } };
      priority_override: { enum: ["P0", "P1", "P2"] };
      include_web_search: { type: "boolean"; default: false };
    };
  };
}

async function executeMasterWorkflow(args: MasterWorkflowArgs) {
  const workflow = new RooCodeWorkflow(config);
  
  switch (args.workflow_type) {
    case 'full_analysis':
      return await workflow.fullAnalysis({
        files: args.target_files,
        priority: args.priority_override,
        webSearch: args.include_web_search
      });
      
    case 'quick_check':
      return await workflow.quickCheck(args.target_files);
      
    case 'context_condensing':
      return await workflow.contextCondensing({
        compressionRate: config.priorities.default_compression_rate
      });
      
    case 'daily_digest':
      return await workflow.generateDailyDigest();
  }
}

class RooCodeWorkflow {
  async fullAnalysis(options: FullAnalysisOptions) {
    // Phase 1: Inspection
    const inspectionResults = await this.executeCodeIntelligence({
      phase: 'inspection',
      files: options.files
    });
    
    // Phase 2: Diagnosis
    const diagnosisResults = await this.executeCodeIntelligence({
      phase: 'diagnosis',
      files: options.files,
      context: inspectionResults
    });
    
    // Enhanced with external tools
    if (options.webSearch) {
      const webResults = await this.executeSerpAPI({
        query: this.generateSearchQuery(diagnosisResults),
        search_type: 'error_solution'
      });
      diagnosisResults.webContext = webResults;
    }
    
    // ESLint analysis
    const lintResults = await this.executeESLint({
      file_path: options.files[0],
      auto_fix: false
    });
    
    // TypeScript diagnostics
    const tsResults = await this.executeTypeScript({
      file_path: options.files[0],
      check_type: 'all'
    });
    
    // Phase 3: Execution Plan
    const executionPlan = await this.executeCodeIntelligence({
      phase: 'execution',
      context: { ...diagnosisResults, lintResults, tsResults }
    });
    
    // Update memory bank
    await this.executeMemoryBank({
      action: 'update',
      file_category: 'technical',
      file_name: 'error-log.md',
      content: this.formatAnalysisResult(executionPlan)
    });
    
    return {
      inspection: inspectionResults,
      diagnosis: diagnosisResults,
      execution: executionPlan,
      external_tools: {
        eslint: lintResults,
        typescript: tsResults,
        web_search: diagnosisResults.webContext
      }
    };
  }
}
```

## 📦 Package Structure

```
roo-code-intelligence-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main MCP Server
│   ├── tools/
│   │   ├── code-intelligence.ts    # Core analysis engine
│   │   ├── memory-bank.ts          # Memory management
│   │   ├── serpapi.ts             # Web search integration
│   │   ├── sequential-thinking.ts  # Thinking process
│   │   ├── eslint-integration.ts   # Code quality
│   │   └── typescript-integration.ts # Type checking
│   ├── workflows/
│   │   ├── master-workflow.ts      # Main workflow orchestrator
│   │   ├── context-condensing.ts   # Context management
│   │   └── daily-digest.ts         # Reporting
│   ├── utils/
│   │   ├── config-loader.ts        # YAML config loader
│   │   ├── cache-manager.ts        # Result caching
│   │   └── file-watcher.ts         # VS Code file monitoring
│   └── types/
│       ├── config.ts               # Configuration types
│       ├── tools.ts                # Tool interfaces
│       └── workflow.ts             # Workflow types
├── config/
│   └── default-config.yaml         # Default configuration
└── README.md
```

## 🚀 Installation & Setup Instructions

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk
npm install @types/node typescript
npm install yaml chokidar

# Build the server
npm run build

# Register with MCP client
echo '{
  "mcpServers": {
    "roo-code-intelligence": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "SERPAPI_KEY": "SERP_API_KEY"
      }
    }
  }
}' > ~/.claude-desktop/claude_desktop_config.json
```

## 🎯 Usage Examples

```javascript
// Example 1: Full code analysis
await mcp.call("roo_code_workflow", {
  workflow_type: "full_analysis",
  target_files: ["src/auth.ts", "src/types.ts"],
  include_web_search: true
});

// Example 2: Quick ESLint check
await mcp.call("eslint_analysis", {
  file_path: "src/components/Header.tsx",
  auto_fix: true
});

// Example 3: Context condensing
await mcp.call("roo_code_workflow", {
  workflow_type: "context_condensing"
});

// Example 4: Web search for solutions
await mcp.call("web_search_enhanced", {
  query: "TypeScript interface extends generic constraint",
  search_type: "documentation",
  max_results: 5
});
```

## 📋 Success Criteria

1. **Performance Metrics**:
   - Response time < 2 seconds for analysis
   - Memory usage < 100MB
   - Cache hit rate > 70%

2. **Integration Quality**:
   - All external tools properly integrated
   - YAML configuration fully supported
   - VS Code events properly handled

3. **Reliability**:
   - Error handling for all external API calls
   - Graceful degradation when tools unavailable
   - Comprehensive logging and debugging

This MCP Server will transform Gemini 2.5 Flash into a powerful code intelligence system with the expected 43.4% performance improvement outlined in the previous analysis.
```

هذا الـ prompt يوفر إطار عمل شامل لبناء MCP Server مخصص يحقق جميع التحسينات المطلوبة ويدمج الأدوات الخارجية بشكل فعال مع الحفاظ على الأداء العالي والموثوقية.
