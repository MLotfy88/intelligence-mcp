import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import { WorkflowArgs, DiagnosisResults, LintResults, TypeScriptResults } from '../types/master-workflow.d.js';

export function getMasterWorkflowToolDefinition(_config: Config): { name: string; description: string; schema: object; handler: (args: WorkflowArgs, context: { call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown> }) => Promise<unknown> } {
  return {
    name: 'roo_code_workflow',
    description: 'Execute complete analysis workflow',
    schema: {
      type: 'object',
      properties: {
        workflow_type: {
          type: 'string',
          enum: ['full_analysis', 'quick_check', 'context_condensing', 'daily_digest', 'generate_memory_map']
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
    handler: async (args: WorkflowArgs, context: { call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown> }): Promise<unknown> => {
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
          case 'generate_memory_map':
            return await generateMemoryMapWorkflow(args, context.call, _config);
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

async function fullAnalysis(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown>, config: Config): Promise<unknown> {
  if (!args.target_files || args.target_files.length === 0) {
    throw new Error('target_files is required for full_analysis workflow.');
  }
  // Phase 1: Inspection
  const inspectionResults = await call('code_intelligence_analyze', {
    phase: 'inspection',
    file_path: args.target_files[0],
    priority_level: args.priority_override || 'P1'
  });

  // Phase 2: Diagnosis
  const diagnosisResults: DiagnosisResults = await call('code_intelligence_analyze', {
    phase: 'diagnosis',
    file_path: args.target_files[0],
    priority_level: args.priority_override || 'P1'
  }) as DiagnosisResults;

  // Optional web search
  if (args.include_web_search) {
    const searchResults = await call('web_search_enhanced', {
      query: generateSearchQuery(diagnosisResults),
      search_type: 'error_solution',
      max_results: 10
    });
    diagnosisResults.webContext = searchResults;
  }

  // Run linting
  const lintResults: LintResults = await call('eslint_analysis', {
    file_path: args.target_files[0],
    auto_fix: false
  }) as LintResults;

  // Run TypeScript checks
  const tsResults: TypeScriptResults = await call('typescript_diagnostics', {
    file_path: args.target_files[0],
    check_type: 'all',
    include_suggestions: true
  }) as TypeScriptResults;

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
      webSearch: diagnosisResults.webContext
    }
  };
}

async function quickCheck(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown>, _config: Config): Promise<unknown> {
  if (!args.target_files || args.target_files.length === 0) {
    throw new Error('target_files is required for quick_check workflow.');
  }
  const [lintResults, tsResults] = await Promise.all([
    call('eslint_analysis', {
      file_path: args.target_files[0],
      auto_fix: false
    }) as Promise<LintResults>,
    call('typescript_diagnostics', {
      file_path: args.target_files[0],
      check_type: 'syntax',
      include_suggestions: false
    }) as Promise<TypeScriptResults>
  ]);

  return {
    eslint: lintResults,
    typescript: tsResults,
    summary: generateQuickSummary(lintResults, tsResults)
  };
}

async function contextCondensing(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown>, _config: Config): Promise<unknown> {
  return await call('context_condensing_process', {
    target_files: args.target_files,
    compression_rate: _config.priorities.default_compression_rate
  });
}

async function dailyDigest(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown>, _config: Config): Promise<unknown> {
  return await call('daily_digest_generator', {});
}

function generateSearchQuery(diagnosisResults: DiagnosisResults): string {
  const queryParts: string[] = [];

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

async function storeResults(args: WorkflowArgs, results: Record<string, unknown>, call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown>, _config: Config): Promise<void> {
  await call('memory_bank_manager', {
    action: 'write',
    file_category: 'technical',
    file_name: `analysis-${Date.now()}.json`,
    content: JSON.stringify(results, null, 2)
  });
}

function generateQuickSummary(lintResults: LintResults, tsResults: TypeScriptResults): { totalIssues: number; needsAttention: boolean } {
  return {
    totalIssues: (lintResults.summary?.totalErrors || 0) +
                 (tsResults.summary?.errorCount || 0),
    needsAttention: (lintResults.summary?.totalErrors || 0) > 0 ||
                   (tsResults.summary?.errorCount || 0) > 0
  };
}

async function generateMemoryMapWorkflow(args: WorkflowArgs, call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown>, _config: Config): Promise<unknown> {
  if (!args.target_files || args.target_files.length === 0) {
    throw new Error('target_files is required for generate_memory_map workflow.');
  }
  logger.info(`Generating memory map for: ${args.target_files[0]}`);
  return await call('generate_memory_map', { file_path: args.target_files[0] });
}
