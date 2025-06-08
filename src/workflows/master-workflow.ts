import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

interface WorkflowArgs {
  workflow_type: 'full_analysis' | 'quick_check' | 'context_condensing' | 'daily_digest';
  target_files: string[];
  priority_override?: 'P0' | 'P1' | 'P2';
  include_web_search?: boolean;
}

export function getMasterWorkflowToolDefinition(config: Config): { name: string; description: string; schema: any; handler: any } {
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
    handler: async (args: WorkflowArgs, context: { call: (toolName: string, toolArgs: any) => Promise<any> }) => {
      logger.info(`Starting workflow: ${args.workflow_type}`);

      try {
        switch (args.workflow_type) {
          case 'full_analysis':
            return await fullAnalysis(args, context.call, config);
          case 'quick_check':
            return await quickCheck(args, context.call, config);
          case 'context_condensing':
            return await contextCondensing(args, context.call, config);
          case 'daily_digest':
            return await dailyDigest(args, context.call, config);
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

async function fullAnalysis(args: WorkflowArgs, call: (toolName: string, toolArgs: any) => Promise<any>, config: Config) {
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
    (diagnosisResults as any).webContext = searchResults;
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
    priority_level: args.priority_override || 'P1'
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
      webSearch: (diagnosisResults as any).webContext
    }
  };
}

async function quickCheck(args: WorkflowArgs, call: (toolName: string, toolArgs: any) => Promise<any>, config: Config) {
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

async function contextCondensing(args: WorkflowArgs, call: (toolName: string, toolArgs: any) => Promise<any>, config: Config) {
  return await call('context_condensing_process', {
    target_files: args.target_files,
    compression_rate: config.priorities.default_compression_rate
  });
}

async function dailyDigest(args: WorkflowArgs, call: (toolName: string, toolArgs: any) => Promise<any>, config: Config) {
  return await call('daily_digest_generator', {});
}

function generateSearchQuery(diagnosisResults: any): string {
  // Implement search query generation based on diagnosis results
  return `typescript ${diagnosisResults.errors?.[0]?.message || 'error'}`;
}

async function storeResults(args: WorkflowArgs, results: any, call: (toolName: string, toolArgs: any) => Promise<any>, config: Config) {
  await call('memory_bank_manager', {
    action: 'write',
    file_category: 'technical',
    file_name: `analysis-${Date.now()}.json`,
    content: JSON.stringify(results, null, 2)
  });
}

function generateQuickSummary(lintResults: any, tsResults: any) {
  return {
    totalIssues: (lintResults.summary?.totalErrors || 0) +
                 (tsResults.summary?.errorCount || 0),
    needsAttention: (lintResults.summary?.totalErrors || 0) > 0 ||
                   (tsResults.summary?.errorCount || 0) > 0
  };
}
