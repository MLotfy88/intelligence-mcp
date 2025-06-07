import { Server } from '../types/mcp-sdk.js';
import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

interface WorkflowArgs {
  workflow_type: 'full_analysis' | 'quick_check' | 'context_condensing' | 'daily_digest';
  target_files: string[];
  priority_override?: 'P0' | 'P1' | 'P2';
  include_web_search?: boolean;
}

export class MasterWorkflow {
  private server: Server;
  private config: Config;

  constructor(server: Server, config: Config) {
    this.server = server;
    this.config = config;
  }

  async register() {
    this.server.addTool({
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
      handler: (args: WorkflowArgs) => this.executeWorkflow(args)
    });
  }

  private async executeWorkflow(args: WorkflowArgs) {
    logger.info(`Starting workflow: ${args.workflow_type}`);

    try {
      switch (args.workflow_type) {
        case 'full_analysis':
          return await this.fullAnalysis(args);
        case 'quick_check':
          return await this.quickCheck(args);
        case 'context_condensing':
          return await this.contextCondensing(args);
        case 'daily_digest':
          return await this.dailyDigest(args);
        default:
          throw new Error(`Invalid workflow type: ${args.workflow_type}`);
      }
    } catch (error) {
      logger.error(`Workflow ${args.workflow_type} failed`, error);
      throw error;
    }
  }

  private async fullAnalysis(args: WorkflowArgs) {
    // Phase 1: Inspection
    const inspectionResults = await this.server.call('code_intelligence_analyze', {
      phase: 'inspection',
      file_path: args.target_files[0],
      priority_level: args.priority_override || 'P1'
    });

    // Phase 2: Diagnosis
    const diagnosisResults = await this.server.call('code_intelligence_analyze', {
      phase: 'diagnosis',
      file_path: args.target_files[0],
      priority_level: args.priority_override || 'P1'
    });

    // Optional web search
    if (args.include_web_search) {
      const searchResults = await this.server.call('web_search_enhanced', {
        query: this.generateSearchQuery(diagnosisResults),
        search_type: 'error_solution'
      });
      diagnosisResults.webContext = searchResults;
    }

    // Run linting
    const lintResults = await this.server.call('eslint_analysis', {
      file_path: args.target_files[0],
      auto_fix: false
    });

    // Run TypeScript checks
    const tsResults = await this.server.call('typescript_diagnostics', {
      file_path: args.target_files[0],
      check_type: 'all',
      include_suggestions: true
    });

    // Phase 3: Execution
    const executionResults = await this.server.call('code_intelligence_analyze', {
      phase: 'execution',
      file_path: args.target_files[0],
      priority_level: args.priority_override || 'P1'
    });

    // Store results
    await this.storeResults(args, {
      inspection: inspectionResults,
      diagnosis: diagnosisResults,
      execution: executionResults,
      linting: lintResults,
      typescript: tsResults
    });

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

  private async quickCheck(args: WorkflowArgs) {
    const [lintResults, tsResults] = await Promise.all([
      this.server.call('eslint_analysis', {
        file_path: args.target_files[0],
        auto_fix: false
      }),
      this.server.call('typescript_diagnostics', {
        file_path: args.target_files[0],
        check_type: 'syntax',
        include_suggestions: false
      })
    ]);

    return {
      eslint: lintResults,
      typescript: tsResults,
      summary: this.generateQuickSummary(lintResults, tsResults)
    };
  }

  private async contextCondensing(args: WorkflowArgs) {
    // Implement context condensing logic
    return {
      condensed: true,
      files: args.target_files
    };
  }

  private async dailyDigest(args: WorkflowArgs) {
    // Implement daily digest generation
    return {
      generated: true,
      timestamp: new Date().toISOString()
    };
  }

  private generateSearchQuery(diagnosisResults: any): string {
    // Implement search query generation based on diagnosis results
    return `typescript ${diagnosisResults.errors?.[0]?.message || 'error'}`;
  }

  private async storeResults(args: WorkflowArgs, results: any) {
    await this.server.call('memory_bank_manager', {
      action: 'write',
      file_category: 'technical',
      file_name: `analysis-${Date.now()}.json`,
      content: JSON.stringify(results, null, 2)
    });
  }

  private generateQuickSummary(lintResults: any, tsResults: any) {
    return {
      totalIssues: (lintResults.summary?.totalErrors || 0) + 
                   (tsResults.summary?.errorCount || 0),
      needsAttention: (lintResults.summary?.totalErrors || 0) > 0 ||
                     (tsResults.summary?.errorCount || 0) > 0
    };
  }
}
