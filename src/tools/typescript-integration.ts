import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import * as ts from 'typescript';
import {
  TypeScriptArgs,
  DiagnosticResult
} from '../types/typescript-integration.d.js';

export function getTypeScriptToolDefinition(config: Config): { name: string; description: string; schema: any; handler: any } {
  return {
    name: 'typescript_diagnostics',
    description: 'TypeScript type checking and diagnostics',
    schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        check_type: {
          type: 'string',
          enum: ['syntax', 'semantic', 'all']
        },
        include_suggestions: {
          type: 'boolean',
          default: true
        }
      },
      required: ['file_path', 'check_type']
    },
    handler: async (args: TypeScriptArgs): Promise<DiagnosticResult> => {
      logger.info(`Running TypeScript diagnostics on ${args.file_path}`);
      
      try {
        const program = createProgram(args.file_path, config);
        const diagnostics = getDiagnostics(program, args);

        return formatDiagnostics(diagnostics, args.include_suggestions, config.integrations.typescript.diagnostic_level);
      } catch (error) {
        logger.error('TypeScript diagnostics failed', (error as Error).message);
        throw error;
      }
    }
  };
}

function createProgram(filePath: string, config: Config): ts.Program {
  const tsConfigPath = config.integrations.typescript.tsconfig_path;
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  const { options, errors } = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    process.cwd()
  );

  if (errors.length > 0) {
    logger.error('Failed to parse tsconfig.json', errors);
  }

  return ts.createProgram([filePath], options);
}

function getDiagnostics(program: ts.Program, args: TypeScriptArgs): readonly ts.Diagnostic[] {
  const sourceFile = program.getSourceFile(args.file_path);
  if (!sourceFile) {
    throw new Error(`Could not find source file: ${args.file_path}`);
  }

  switch (args.check_type) {
    case 'syntax':
      return ts.getPreEmitDiagnostics(program).filter(
        d => d.category === ts.DiagnosticCategory.Error
      );
    case 'semantic':
      return program.getSemanticDiagnostics(sourceFile);
    case 'all':
      return [
        ...ts.getPreEmitDiagnostics(program),
        ...program.getSemanticDiagnostics(sourceFile)
      ];
    default:
      throw new Error(`Invalid check type: ${args.check_type}`);
  }
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[], includeSuggestions: boolean, diagnosticLevel: string): DiagnosticResult {
  const diagnosticLevelMap: { [key: string]: ts.DiagnosticCategory } = {
    'error': ts.DiagnosticCategory.Error,
    'warning': ts.DiagnosticCategory.Warning,
    'suggestion': ts.DiagnosticCategory.Suggestion,
    'message': ts.DiagnosticCategory.Message
  };
  const minSeverity = diagnosticLevelMap[diagnosticLevel.toLowerCase()] || ts.DiagnosticCategory.Message;

  const formatted = diagnostics
    .filter(d => d.category >= minSeverity)
    .map(diagnostic => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const category = ts.DiagnosticCategory[diagnostic.category].toLowerCase();

      let line = 0, character = 0;
      if (diagnostic.file && diagnostic.start !== undefined) {
        const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        line = pos.line;
        character = pos.character;
      }

      return {
        message,
        category,
        code: diagnostic.code,
        position: {
          line: line + 1,
          column: character + 1
        },
        file: diagnostic.file?.fileName
      };
    });

  const errors = formatted.filter(d => d.category === 'error');
  const warnings = formatted.filter(d => d.category === 'warning');
  const suggestions = includeSuggestions ?
    formatted.filter(d => d.category === 'suggestion') :
    [];

  return {
    diagnostics: {
      errors,
      warnings,
      suggestions
    },
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      suggestionCount: suggestions.length
    }
  };
}
