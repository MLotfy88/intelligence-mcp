import { logger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as ts from 'typescript';
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
        }
      },
      required: ['phase', 'file_path']
    },
    handler: executeCodeIntelligence
  };
}

async function executeCodeIntelligence(args: CodeIntelligenceArgs): Promise<AnalysisResult | { inspection: InspectionResult; diagnosis: DiagnosisResult; execution: ExecutionResult; summary: { timestamp: string; file: string; priority: string; } }> {
  logger.info(`Starting code intelligence analysis phase: ${args.phase}`);
  
  try {
    switch (args.phase) {
      case 'inspection':
        return await inspectionPhase(args);
      case 'diagnosis':
        return await diagnosisPhase(args);
      case 'execution':
        return await executionPhase(args);
      case 'all':
        return await fullAnalysisPipeline(args);
      default:
        throw new Error(`Invalid phase: ${args.phase}`);
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

    // Basic dependency detection (imports)
    const importRegex = /(?:import|require)\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(fileContent)) !== null) {
      dependencies.push(match[1]);
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
    const fileContent = await fs.readFile(args.file_path, 'utf-8');
    const lines = fileContent.split('\n');

    // Simple keyword-based error/warning/suggestion detection
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
      // Add more sophisticated checks here, e.g., regex for common anti-patterns
    });

  } catch (error) {
    logger.error(`Failed to read file ${args.file_path} during diagnosis: ${(error as Error).message}`);
    // Continue with partial results
  }

  return {
    phase: 'diagnosis',
    errors: errors,
    warnings: warnings,
    suggestions: suggestions
  };
}

async function executionPhase(args: CodeIntelligenceArgs): Promise<ExecutionResult> {
  const solutions: Array<{ type: string; description: string; code?: string }> = [];
  const priority = args.priority_level || 'P2';

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
  const execution = await executionPhase(args);
  
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
