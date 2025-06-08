import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import { WorkflowArgs } from '../types/master-workflow.d.js';

export function getMasterWorkflowToolDefinition(_config: Config): { name: string; description: string; schema: object; handler: (args: WorkflowArgs, context: { call: (toolName: string, toolArgs: Record<string, any>) => Promise<any> }) => Promise<any> } { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
  return {
    name: 'roo_code_workflow',
    description: 'Execute complete analysis workflow',
    schema: {
      type: 'object',
      properties: {
        workflow_type: {
          type: 'string',
          enum: ['full_analysis', 'quick_check', 'context_condensing', 'daily_digest']
        },
        target_files: {
          type: 'array',
          items: { type: 'string' }
        },
        priority_override: {
          type: 'string',
          enum: ['P0', 'P1', 'P2']
        },
        include_web_search: {
          type: 'boolean',
          default: false
        }
      },
      required: ['workflow_type', 'target_files']
    },
    handler: async (args: WorkflowArgs, context: { call: (toolName: string, toolArgs: Record<string, any>) => Promise<any> }): Promise<any> => { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
      logger.info(`Starting workflow: ${args.workflow_type}`);

      try {
        switch (args.workflow_type) {
          case 'full_analysis':
            return await fullAnalysis(args, context.call, _config);
          case 'quick_check':
            return await quickCheck(args, context.call, _config);
          case 'context_condensing':
            return await contextCondensing(args, context.call, _config);
          case 'daily_digest':
            return await dailyDigest(args, context.call, _config);
          default:
            throw new Error(`Invalid workflow type: ${args.workflow_type}`);
        }
      } catch (error) {
        logger.error(`Workflow ${args.workflow_type} failed`, error);
        throw error;
      }
    }
  };
}

async function fullAnalysis(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, any>) => Promise<any>, config: Config): Promise<any> { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
  // Phase 1: Inspection
  const inspectionResults = await call('code_intelligence_analyze', {
    phase: 'inspection',
    file_path: args.target_files[0],
    priority_level: args.priority_override || 'P1'
  });

  // Phase 2: Diagnosis
  const diagnosisResults = await call('code_intelligence_analyze', {
    phase: 'diagnosis',
    file_path: args.target_files[0],
    priority_level: args.priority_override || 'P1'
  });

  // Optional web search
  if (args.include_web_search) {
    const searchResults = await call('web_search_enhanced', {
      query: generateSearchQuery(diagnosisResults),
      search_type: 'error_solution',
      max_results: 10
    });
    (diagnosisResults as Record<string, any>).webContext = searchResults;
  }

  // Run linting
  const lintResults = await call('eslint_analysis', {
    file_path: args.target_files[0],
    auto_fix: false
  });

  // Run TypeScript checks
  const tsResults = await call('typescript_diagnostics', {
    file_path: args.target_files[0],
    check_type: 'all',
    include_suggestions: true
  });

  // Phase 3: Execution
  const executionResults = await call('code_intelligence_analyze', {
    phase: 'execution',
    file_path: args.target_files[0],
    priority_level: args.priority_override || 'P1',
    // Pass diagnosis results to the execution phase for more informed solutions
    diagnosis_results: diagnosisResults // Assuming code_intelligence_analyze's execution phase can accept this
  });

  // Store results
  await storeResults(args, {
    inspection: inspectionResults,
    diagnosis: diagnosisResults,
    execution: executionResults,
    linting: lintResults,
    typescript: tsResults
  }, call, config);

  return {
    inspection: inspectionResults,
    diagnosis: diagnosisResults,
    execution: executionResults,
    toolResults: {
      eslint: lintResults,
      typescript: tsResults,
      webSearch: (diagnosisResults as Record<string, any>).webContext
    }
  };
}

async function quickCheck(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, any>) => Promise<any>, _config: Config): Promise<any> { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
  const [lintResults, tsResults] = await Promise.all([
    call('eslint_analysis', {
      file_path: args.target_files[0],
      auto_fix: false
    }),
    call('typescript_diagnostics', {
      file_path: args.target_files[0],
      check_type: 'syntax',
      include_suggestions: false
    })
  ]);

  return {
    eslint: lintResults,
    typescript: tsResults,
    summary: generateQuickSummary(lintResults, tsResults)
  };
}

async function contextCondensing(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, any>) => Promise<any>, _config: Config): Promise<any> { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
  return await call('context_condensing_process', {
    target_files: args.target_files,
    compression_rate: _config.priorities.default_compression_rate
  });
}

async function dailyDigest(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, any>) => Promise<any>, _config: Config): Promise<any> { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
  return await call('daily_digest_generator', {});
}

function generateSearchQuery(diagnosisResults: Record<string, any>): string {
  let queryParts: string[] = [];

  if (diagnosisResults.errors && diagnosisResults.errors.length > 0) {
    queryParts.push(`error: ${diagnosisResults.errors[0].message}`);
  }
  if (diagnosisResults.warnings && diagnosisResults.warnings.length > 0) {
    queryParts.push(`warning: ${diagnosisResults.warnings[0].message}`);
  }
  if (diagnosisResults.suggestions && diagnosisResults.suggestions.length > 0) {
    queryParts.push(`suggestion: ${diagnosisResults.suggestions[0].message}`);
  }

  if (queryParts.length === 0) {
    return 'code analysis best practices';
  }

  return `typescript ${queryParts.join(' ')}`;
}

async function storeResults(args: WorkflowArgs, results: Record<string, any>, call: (toolName: string, toolArgs: Record<string, any>) => Promise<any>, _config: Config): Promise<void> { // The 'any' type is used for 'toolArgs' because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
  await call('memory_bank_manager', {
    action: 'write',
    file_category: 'technical',
    file_name: `analysis-${Date.now()}.json`,
    content: JSON.stringify(results, null, 2)
  });
}

function generateQuickSummary(lintResults: Record<string, any>, tsResults: Record<string, any>): { totalIssues: number; needsAttention: boolean } {
  return {
    totalIssues: (lintResults.summary?.totalErrors || 0) +
                 (tsResults.summary?.errorCount || 0),
    needsAttention: (lintResults.summary?.totalErrors || 0) > 0 ||
                   (tsResults.summary?.errorCount || 0) > 0
  };
}
