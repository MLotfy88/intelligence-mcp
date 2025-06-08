import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import { Linter } from 'eslint';
import {
  ESLintArgs,
  LintResult,
  FormattedResult
} from '../types/eslint-integration.d.js';

export function getESLintToolDefinition(config: Config): { name: string; description: string; schema: object; handler: (args: ESLintArgs) => Promise<FormattedResult> } {
  return {
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
    handler: async (args: ESLintArgs): Promise<FormattedResult> => {
      logger.info(`Running ESLint analysis on ${args.file_path}`);
      
      try {
        // Using require for ESLint as it doesn't support ES modules well
        const ESLint = (await import('eslint')).ESLint;

        const eslint = new ESLint({
          fix: args.auto_fix && config.integrations.eslint.auto_fix,
          overrideConfig: {
            rules: args.rules_override as Linter.RulesRecord
          }
        });

        const results = await eslint.lintFiles([args.file_path]);
        
        if (args.auto_fix) {
          await ESLint.outputFixes(results);
        }
        
        return formatResults(results, config.integrations.eslint.severity_threshold);
      } catch (error) {
        logger.error('ESLint analysis failed', (error as Error).message);
        throw error;
      }
    }
  };
}

function formatResults(results: LintResult[], severityThreshold: string): FormattedResult {
  const severityMap: { [key: string]: number } = {
    'off': 0,
    'warn': 1,
    'warning': 1,
    'error': 2
  };
  const threshold = severityMap[severityThreshold.toLowerCase()] || 0;

  const formatted = results.map(result => {
    const filteredMessages = result.messages.filter(msg => msg.severity >= threshold);
    return {
      filePath: result.filePath,
      errorCount: filteredMessages.filter(msg => msg.severity === 2).length,
      warningCount: filteredMessages.filter(msg => msg.severity === 1).length,
      messages: filteredMessages.map(msg => ({
        ruleId: msg.ruleId,
        severity: msg.severity,
        message: msg.message,
        line: msg.line,
        column: msg.column,
        fixable: msg.fix !== undefined
      }))
    };
  });

  return {
    results: formatted,
    summary: {
      totalErrors: results.reduce((sum, result) => sum + result.errorCount, 0),
      totalWarnings: results.reduce((sum, result) => sum + result.warningCount, 0),
      filesAnalyzed: results.length
    }
  };
}
