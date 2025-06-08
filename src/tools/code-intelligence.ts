import { logger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as ts from 'typescript';
import { Config, loadConfig } from '../utils/config-loader.js'; // Import Config and loadConfig
import { getTypeScriptToolDefinition } from './typescript-integration.js'; // Import the TypeScript tool
import {
  CodeIntelligenceArgs,
  InspectionResult,
  DiagnosisResult,
  ExecutionResult,
  AnalysisResult
} from '../types/code-intelligence.d.js';

export function getCodeIntelligenceToolDefinition(): { name: string; description: string; schema: object; handler: (args: CodeIntelligenceArgs) => Promise<AnalysisResult | { inspection: InspectionResult; diagnosis: DiagnosisResult; execution: ExecutionResult; summary: { timestamp: string; file: string; priority: string; } }> } {
  return {
    name: 'code_intelligence_analyze',
    description: 'Three-phase code analysis: Inspection → Diagnosis → Execution',
    schema: {
      type: 'object',
      properties: {
        phase: {
          type: 'string',
          enum: ['inspection', 'diagnosis', 'execution', 'all']
        },
        file_path: { type: 'string' },
        context_files: {
          type: 'array',
          items: { type: 'string' }
        },
        priority_level: {
          type: 'string',
          enum: ['P0', 'P1', 'P2']
        },
        diagnosis_results: { // Correctly placed inside properties
          type: 'object',
          description: 'Results from the diagnosis phase, used for generating execution solutions.'
        }
      },
      required: ['phase', 'file_path'] // Correctly placed inside schema
    },
    handler: executeCodeIntelligence
  };
}

async function executeCodeIntelligence(args: CodeIntelligenceArgs): Promise<AnalysisResult | { inspection: InspectionResult; diagnosis: DiagnosisResult; execution: ExecutionResult; summary: { timestamp: string; file: string; priority: string; } }> {
  logger.info(`Starting code intelligence analysis phase: ${args.phase}`);
  
  try {
    switch (args.phase) {
      case 'inspection': {
        return await inspectionPhase(args);
      }
      case 'diagnosis': {
        return await diagnosisPhase(args);
      }
      case 'execution': {
        // If execution phase is requested directly, run diagnosis first
        const diagnosisResultForExecution = await diagnosisPhase(args);
        return await executionPhase(args, diagnosisResultForExecution);
      }
      case 'all': {
        return await fullAnalysisPipeline(args);
      }
      default: {
        throw new Error(`Invalid phase: ${args.phase}`);
      }
    }
  } catch (error) {
    logger.error(`Code intelligence analysis failed in ${args.phase} phase`, error);
    throw error;
  }
}

async function inspectionPhase(args: CodeIntelligenceArgs): Promise<InspectionResult> {
  let fileContent: string | null = null;
  let ast: ts.SourceFile | null = null;
  let complexity = 0;
  const dependencies: string[] = [];

  try {
    fileContent = await fs.readFile(args.file_path, 'utf-8');
    complexity = fileContent.split('\n').length; // Simple line count for complexity

    ast = ts.createSourceFile(
      args.file_path,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    // Enhanced dependency detection using AST
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        dependencies.push(node.moduleSpecifier.text);
      } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require' && node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
        dependencies.push(node.arguments[0].text);
      }
      ts.forEachChild(node, visit);
    };
    if (ast) {
      ts.forEachChild(ast, visit);
    }

  } catch (error) {
    logger.error(`Failed to read or parse file ${args.file_path} during inspection: ${(error as Error).message}`);
    // Continue with partial results if file cannot be read/parsed
  }

  return {
    phase: 'inspection',
    fileContent: fileContent,
    ast: ast,
    metrics: {
      complexity: complexity,
      dependencies: dependencies
    }
  };
}

async function diagnosisPhase(args: CodeIntelligenceArgs): Promise<DiagnosisResult> {
  const errors: Array<{ message: string; line: number; severity: 'error' | 'warning' }> = [];
  const warnings: Array<{ message: string; line: number; severity: 'warning' }> = [];
  const suggestions: Array<{ message: string; line: number }> = [];

  try {
    const config: Config = await loadConfig(); // Load the configuration
    const tsTool = getTypeScriptToolDefinition(config); // Pass config to the tool definition
    const tsDiagnostics = await tsTool.handler({
      file_path: args.file_path,
      check_type: 'all',
      include_suggestions: true
    });

    tsDiagnostics.diagnostics.errors.forEach(diag => {
      errors.push({ message: diag.message, line: diag.position.line, severity: 'error' });
    });
    tsDiagnostics.diagnostics.warnings.forEach(diag => {
      warnings.push({ message: diag.message, line: diag.position.line, severity: 'warning' });
    });
    tsDiagnostics.diagnostics.suggestions.forEach(diag => {
      suggestions.push({ message: diag.message, line: diag.position.line });
    });

    // Add existing simple keyword-based checks as well
    const fileContent = await fs.readFile(args.file_path, 'utf-8');
    const lines = fileContent.split('\n');
    lines.forEach((lineContent, index) => {
      const lineNumber = index + 1;
      if (lineContent.includes('TODO')) {
        suggestions.push({ message: 'Consider addressing this TODO comment.', line: lineNumber });
      }
      if (lineContent.includes('FIXME')) {
        warnings.push({ message: 'This code needs to be fixed.', line: lineNumber, severity: 'warning' });
      }
      if (lineContent.includes('console.log')) {
        suggestions.push({ message: 'Consider removing console.log in production code.', line: lineNumber });
      }
    });

  } catch (error) {
    logger.error(`Failed to perform TypeScript diagnostics or read file ${args.file_path} during diagnosis: ${(error as Error).message}`);
    // Continue with partial results
  }

  return {
    phase: 'diagnosis',
    errors: errors,
    warnings: warnings,
    suggestions: suggestions
  };
}

async function executionPhase(args: CodeIntelligenceArgs, diagnosis: DiagnosisResult): Promise<ExecutionResult> {
  const solutions: Array<{ type: string; description: string; code?: string }> = [];
  const priority = args.priority_level || 'P2';

  // Generate solutions based on diagnosis results
  if (diagnosis.errors.length > 0) {
    solutions.push({
      type: 'error_resolution',
      description: `Address the following critical errors: ${diagnosis.errors.map(e => e.message).join('; ')}`,
      code: '// Example: Implement error handling or fix logic'
    });
  }
  if (diagnosis.warnings.length > 0) {
    solutions.push({
      type: 'code_improvement',
      description: `Review and refactor code based on warnings: ${diagnosis.warnings.map(w => w.message).join('; ')}`,
      code: '// Example: Refactor deprecated functions or improve readability'
    });
  }
  if (diagnosis.suggestions.length > 0) {
    solutions.push({
      type: 'best_practice_adherence',
      description: `Consider implementing the following suggestions for best practices: ${diagnosis.suggestions.map(s => s.message).join('; ')}`,
      code: '// Example: Add JSDoc comments or optimize loops'
    });
  }

  // This is a simplified example. In a real scenario, this would involve
  // more sophisticated logic to generate code or detailed instructions
  // based on the diagnosis results.
  if (args.context_files && args.context_files.length > 0) {
    solutions.push({
      type: 'refactoring_suggestion',
      description: `Consider refactoring based on insights from ${args.context_files.join(', ')}.`,
      code: '// Example refactoring code snippet'
    });
  }

  // Example: If diagnosis found 'FIXME', suggest a fix
  // This would ideally come from actual diagnosis results passed as context
  solutions.push({
    type: 'bug_fix_recommendation',
    description: 'Review and address any FIXME comments in the codebase.',
    code: '/* Example fix: Replace old_function() with new_function() */'
  });

  return {
    phase: 'execution',
    solutions: solutions,
    priority: priority
  };
}

async function fullAnalysisPipeline(args: CodeIntelligenceArgs): Promise<{ inspection: InspectionResult; diagnosis: DiagnosisResult; execution: ExecutionResult; summary: { timestamp: string; file: string; priority: string; } }> {
  const inspection = await inspectionPhase(args);
  const diagnosis = await diagnosisPhase(args);
  const execution = await executionPhase(args, diagnosis); // Pass diagnosis to executionPhase
  
  return {
    inspection,
    diagnosis,
    execution,
    summary: {
      timestamp: new Date().toISOString(),
      file: args.file_path,
      priority: args.priority_level || 'P2'
    }
  };
}
