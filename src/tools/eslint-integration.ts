import { Server } from '../types/mcp-sdk.js';
import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import type { ESLint } from 'eslint';

interface ESLintArgs {
  file_path: string;
  auto_fix: boolean;
  rules_override?: Record<string, any>;
}

interface LintMessageFix {
  text: string;
  range: [number, number];
}

interface LintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
  column: number;
  fix?: LintMessageFix;
}

interface LintResult {
  filePath: string;
  errorCount: number;
  warningCount: number;
  messages: LintMessage[];
}

interface FormattedResult {
  results: Array<{
    filePath: string;
    errorCount: number;
    warningCount: number;
    messages: Array<{
      ruleId: string | null;
      severity: number;
      message: string;
      line: number;
      column: number;
      fixable: boolean;
    }>;
  }>;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    filesAnalyzed: number;
  };
}

export async function registerESLint(server: Server, config: Config): Promise<void> {
  server.addTool({
    name: 'eslint_analysis',
    description: 'Code quality analysis with auto-fix capabilities',
    schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        auto_fix: { 
          type: 'boolean',
          default: false
        },
        rules_override: {
          type: 'object',
          additionalProperties: true
        }
      },
      required: ['file_path']
    },
    handler: async (args: ESLintArgs) => {
      logger.info(`Running ESLint analysis on ${args.file_path}`);
      
      try {
        // Using require for ESLint as it doesn't support ES modules well
        const ESLint = (await import('eslint')).ESLint;

        const eslint = new ESLint({
          fix: args.auto_fix && config.integrations.eslint.auto_fix,
          overrideConfig: {
            rules: args.rules_override
          }
        });

        const results = await eslint.lintFiles([args.file_path]);
        
        if (args.auto_fix) {
          await ESLint.outputFixes(results);
        }
        
        return formatResults(results);
      } catch (error) {
        logger.error('ESLint analysis failed', error);
        throw error;
      }
    }
  });
}

function formatResults(results: LintResult[]): FormattedResult {
  const formatted = results.map(result => ({
    filePath: result.filePath,
    errorCount: result.errorCount,
    warningCount: result.warningCount,
    messages: result.messages.map(msg => ({
      ruleId: msg.ruleId,
      severity: msg.severity,
      message: msg.message,
      line: msg.line,
      column: msg.column,
      fixable: msg.fix !== undefined
    }))
  }));

  return {
    results: formatted,
    summary: {
      totalErrors: results.reduce((sum, result) => sum + result.errorCount, 0),
      totalWarnings: results.reduce((sum, result) => sum + result.warningCount, 0),
      filesAnalyzed: results.length
    }
  };
}
