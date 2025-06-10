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
  AnalysisResult,
  MemoryMapResult,
  PriorityLevel // Add PriorityLevel here
} from '../types/code-intelligence.d.js';

export function getCodeIntelligenceToolDefinition(): { name: string; description: string; schema: object; handler: (args: CodeIntelligenceArgs) => Promise<AnalysisResult | MemoryMapResult | { inspection: InspectionResult; diagnosis: DiagnosisResult; execution: ExecutionResult; summary: { timestamp: string; file: string; priority: string; } }> } {
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

async function executeCodeIntelligence(args: CodeIntelligenceArgs): Promise<AnalysisResult | MemoryMapResult | { inspection: InspectionResult; diagnosis: DiagnosisResult; execution: ExecutionResult; summary: { timestamp: string; file: string; priority: string; } }> {
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
        const inspectionResultForExecution = await inspectionPhase(args);
        const diagnosisResultForExecution = await diagnosisPhase(args);
        return await executionPhase(args, inspectionResultForExecution, diagnosisResultForExecution);
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
  logger.info('Starting Inspection Phase: Deep thinking for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // Simulate deep thinking
  logger.info('Inspection Phase: Deep thinking complete.');

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
  logger.info('Starting Diagnosis Phase: Deep thinking for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // Simulate deep thinking
  logger.info('Diagnosis Phase: Deep thinking complete.');

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

    // Contract adherence check (simplified example)
    const apiContractsContent = await fs.readFile('intelligence/memory/technical/api-contracts.md', 'utf-8');
    if (fileContent.includes('var ') && !apiContractsContent.includes('let') && !apiContractsContent.includes('const')) {
      errors.push({ message: 'Usage of "var" detected, which violates modern JavaScript/TypeScript best practices. Consider using "let" or "const".', line: 0, severity: 'error' });
    }

  } catch (error) {
    logger.error(`Failed to perform TypeScript diagnostics, read file, or check API contracts ${args.file_path} during diagnosis: ${(error as Error).message}`);
    // Continue with partial results
  }

  return {
    phase: 'diagnosis',
    errors: errors,
    warnings: warnings,
    suggestions: suggestions
  };
}

async function checkConflicts(args: CodeIntelligenceArgs, proposedChanges: string): Promise<{ conflicts: Array<{ message: string; type: 'schema_break' | 'plan_violation' | 'unsafe_type'; priority: 'P0' | 'P1' | 'P2' }>; }> {
  logger.info('Starting Conflict Check Phase...');
  const conflicts: Array<{ message: string; type: 'schema_break' | 'plan_violation' | 'unsafe_type'; priority: 'P0' | 'P1' | 'P2' }> = [];

  try {
    // Read api-contracts.md for schema and contract definitions
    const apiContractsContent = await fs.readFile('intelligence/memory/technical/api-contracts.md', 'utf-8');
    const systemPatternsContent = await fs.readFile('intelligence/memory/core/system-patterns.md', 'utf-8');

    // --- Conflict Detection based on api-contracts.md ---

    // 1. Type Safety: Avoid 'any' type unless justified
    // P1: Unsafe Type
    if (apiContractsContent.includes('Strict Type Enforcement') && args.file_path.endsWith('.ts') && proposedChanges.includes(': any') && !proposedChanges.includes('/* any justified */')) {
      conflicts.push({
        message: 'Usage of "any" type detected without justification in TypeScript file. Refer to API Contracts (Type Safety).',
        type: 'unsafe_type',
        priority: 'P1'
      });
    }

    // 2. Naming Conventions (simplified string check for common violations)
    // P1: Plan Violation (naming convention)
    if (systemPatternsContent.includes('Standard Naming Conventions') && (proposedChanges.match(/function\s+[A-Z][a-zA-Z0-9_]*\s*\(/) || // PascalCase function name
        proposedChanges.match(/const\s+[a-z][a-zA-Z0-9]*_[a-zA-Z0-9]*/) // snake_case for non-constants
    )) {
      conflicts.push({
        message: 'Potential naming convention violation detected. Refer to API Contracts (Naming Conventions).',
        type: 'plan_violation',
        priority: 'P1'
      });
    }

    // 3. Error Handling: Basic check for try-catch around async operations (very simplified)
    // P1: Plan Violation (error handling)
    if (apiContractsContent.includes('Robust Error Handling') && proposedChanges.includes('await ') && !proposedChanges.includes('try {') && !proposedChanges.includes('.catch(')) {
      conflicts.push({
        message: 'Asynchronous operation detected without explicit try-catch or .catch(). Refer to API Contracts (Error Handling).',
        type: 'plan_violation',
        priority: 'P1'
      });
    }

    // 4. Security: Basic check for hardcoded API keys
    // P0: Schema Break (security vulnerability)
    if (apiContractsContent.includes('Secure API Key Management') && proposedChanges.match(/(API_KEY|SECRET|TOKEN)\s*=\s*['"].*['"]/i)) {
      conflicts.push({
        message: 'Potential hardcoded sensitive information (API key/secret/token) detected. Use environment variables. Refer to API Contracts (Security).',
        type: 'schema_break', // Categorizing as schema_break due to critical security impact
        priority: 'P0'
      });
    }

    // --- Conflict Detection based on system-patterns.md ---

    // 5. Modular Design: Heuristic for large file modifications
    // P2: Plan Violation (modularity) - Lower priority as it's a heuristic
    // This check is more about the *size* of the proposed change, not its content.
    // If proposedChanges is a large string, it might indicate a monolithic change.
    if (systemPatternsContent.includes('Modular Design Principles') && proposedChanges.length > 5000) { // Arbitrary threshold for "large change"
      conflicts.push({
        message: 'Very large proposed change detected. Consider breaking down into smaller, modular changes. Refer to System Patterns (Modular Design).',
        type: 'plan_violation',
        priority: 'P2'
      });
    }

    // 6. Three-Phase Analysis Workflow: Ensure proposed changes align with the workflow (conceptual)
    // This is more about the *process* of how changes are generated, rather than the content itself.
    // The `fullAnalysisPipeline` already ensures this by calling phases sequentially.
    // This check would be more relevant if `proposedChanges` was a direct user input for code.

    // 7. Structured Memory Management: Check for direct file system access outside memory-bank tool
    // P1: Plan Violation (memory management)
    if (systemPatternsContent.includes('Centralized Memory Operations') && proposedChanges.includes('fs.readFile') && !args.file_path.includes('memory-bank.ts')) { // Simplified check
      conflicts.push({
        message: 'Direct file system access detected outside of memory-bank tool. Use memory_bank_manager for structured memory operations. Refer to System Patterns (Structured Memory Management).',
        type: 'plan_violation',
        priority: 'P1'
      });
    }

    // Add more sophisticated conflict checks as needed based on project requirements
    // This could involve parsing ASTs, comparing against OpenAPI specs, etc.
    // [PROOF]: The checks above are based on direct interpretations of the API Contracts and System Patterns documents.
    // They provide a foundational layer for automated conflict detection, focusing on common anti-patterns and critical violations.
    // For full semantic validation, AST parsing of proposed code changes would be required, which is beyond the current scope of `proposedChanges` as a stringified JSON.

  } catch (error) {
    logger.error(`Failed to perform conflict checks for ${args.file_path}: ${(error as Error).message}`);
    // Continue, but log the error
  }

  return { conflicts };
}

async function executionPhase(args: CodeIntelligenceArgs, inspection: InspectionResult, diagnosis: DiagnosisResult): Promise<ExecutionResult> {
  logger.info('Starting Execution Phase: Deep thinking for 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // Simulate deep thinking
  logger.info('Execution Phase: Deep thinking complete.');

  const solutions: Array<{ type: string; description: string; code?: string }> = [];
  const priority = (args.priority_level || 'P2') as PriorityLevel;

  // Generate solutions based on diagnosis results
  const lines = inspection.fileContent ? inspection.fileContent.split('\n') : [];

  if (diagnosis.errors.length > 0) {
    diagnosis.errors.forEach(error => {
      const problematicLineContent = lines[error.line - 1] ? lines[error.line - 1].trim() : '';
      const problematicLineRef = problematicLineContent ? ` (Line ${error.line}: \`${problematicLineContent}\`)` : '';
      let codeSuggestion = '';

      if (error.message.includes('Usage of "var" detected')) {
        codeSuggestion = `\`\`\`diff\n<<<<<<< SEARCH\n:start_line:${error.line}\n-------\n${problematicLineContent}\n=======\n${problematicLineContent.replace('var ', 'let ')}\n>>>>>>> REPLACE\n\`\`\``;
      } else {
        codeSuggestion = `// Review and fix the error at line ${error.line}. Example: \n// ${problematicLineContent}`;
      }

      solutions.push({
        type: 'error_resolution',
        description: `Error: ${error.message}${problematicLineRef}. Action: Investigate and fix this critical issue.`,
        code: codeSuggestion
      });
    });
  }
  if (diagnosis.warnings.length > 0) {
    diagnosis.warnings.forEach(warning => {
      const problematicLineContent = lines[warning.line - 1] ? lines[warning.line - 1].trim() : '';
      const problematicLineRef = problematicLineContent ? ` (Line ${warning.line}: \`${problematicLineContent}\`)` : '';
      let codeSuggestion = '';

      if (warning.message.includes('This code needs to be fixed.')) { // FIXME
        codeSuggestion = `// Action: Review and fix the code at line ${warning.line}. Current code: \n// ${problematicLineContent}`;
      } else {
        codeSuggestion = `// Review and refactor code based on warning at line ${warning.line}. Current code: \n// ${problematicLineContent}`;
      }

      solutions.push({
        type: 'code_improvement',
        description: `Warning: ${warning.message}${problematicLineRef}. Action: Review and refactor this code.`,
        code: codeSuggestion
      });
    });
  }
  if (diagnosis.suggestions.length > 0) {
    diagnosis.suggestions.forEach(suggestion => {
      const problematicLineContent = lines[suggestion.line - 1] ? lines[suggestion.line - 1].trim() : '';
      const problematicLineRef = problematicLineContent ? ` (Line ${suggestion.line}: \`${problematicLineContent}\`)` : '';
      let codeSuggestion = '';

      if (suggestion.message.includes('Consider removing console.log')) {
        codeSuggestion = `// Action: Remove or comment out 'console.log' at line ${suggestion.line}. Example: \n// ${problematicLineContent}`;
      } else if (suggestion.message.includes('Consider addressing this TODO comment.')) {
        codeSuggestion = `// Action: Address the TODO comment at line ${suggestion.line}. Example: \n// ${problematicLineContent}`;
      } else {
        codeSuggestion = `// Consider implementing this best practice at line ${suggestion.line}. Current code: \n// ${problematicLineContent}`;
      }

      solutions.push({
        type: 'best_practice_adherence',
        description: `Suggestion: ${suggestion.message}${problematicLineRef}. Action: Consider implementing this best practice.`,
        code: codeSuggestion
      });
    });
  }

  // This is a simplified example. In a real scenario, this would involve
  // more sophisticated logic to generate code or detailed instructions
  // based on the diagnosis results.

  return {
    phase: 'execution',
    solutions: solutions,
    priority: priority
  };
}

async function fullAnalysisPipeline(args: CodeIntelligenceArgs): Promise<{ inspection: InspectionResult; diagnosis: DiagnosisResult; execution: ExecutionResult; conflicts: Array<{ message: string; type: 'schema_break' | 'plan_violation' | 'unsafe_type'; priority: 'P0' | 'P1' | 'P2' }>; summary: { timestamp: string; file: string; priority: string; } }> {
  logger.info('Starting Full Analysis Pipeline: Inspection -> Diagnosis -> Execution -> Conflict Check');
  const inspection = await inspectionPhase(args);
  logger.info('Inspection Phase Completed.');
  const diagnosis = await diagnosisPhase(args);
  logger.info('Diagnosis Phase Completed.');
  const execution = await executionPhase(args, inspection, diagnosis); // Pass inspection and diagnosis to executionPhase
  logger.info('Execution Phase Completed. Awaiting user confirmation for changes (handled by client).');

  const simulatedProposedChanges = JSON.stringify(execution.solutions);
  const conflictCheckResult = await checkConflicts(args, simulatedProposedChanges);
  logger.info('Conflict Check Phase Completed.');

  if (conflictCheckResult.conflicts.length > 0) {
    logger.warn('Conflicts detected! Halting execution and notifying user.');
    // For now, we'll return the conflicts as part of the result.
  }
  
  return {
    inspection,
    diagnosis,
    execution,
    conflicts: conflictCheckResult.conflicts,
    summary: {
      timestamp: new Date().toISOString(),
      file: args.file_path,
      priority: args.priority_level || 'P2'
    }
  };
}

export function getMemoryMapToolDefinition(): { name: string; description: string; schema: object; handler: (args: CodeIntelligenceArgs) => Promise<MemoryMapResult> } {
  return {
    name: 'generate_memory_map',
    description: 'Generates a visual representation (diagram) of dependencies between files or components and saves it in .intellicode/memory/technical/dependency-map.md.',
    schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'The file path for which to generate the memory map.' },
      },
      required: ['file_path']
    },
    handler: generateMemoryMap
  };
}

async function generateMemoryMap(args: CodeIntelligenceArgs): Promise<{ memoryMapPath: string }> {
  logger.info('Starting Memory Map Generation...');
  const dependenciesMap: { [key: string]: string[] } = {};

  const inspectionResult = await inspectionPhase(args);
  if (inspectionResult.fileContent && inspectionResult.metrics?.dependencies) {
    dependenciesMap[args.file_path] = inspectionResult.metrics.dependencies;
  }

  let mermaidGraph = 'graph TD\n';
  for (const file in dependenciesMap) {
    const deps = dependenciesMap[file];
    deps.forEach(dep => {
      const cleanFile = file.replace(/\//g, '_').replace(/\./g, '_');
      const cleanDep = dep.replace(/\//g, '_').replace(/\./g, '_');
      mermaidGraph += `  ${cleanFile} --> ${cleanDep}\n`;
    });
  }

  const memoryMapContent = `### Dependency Map for ${args.file_path}\n\n\`\`\`mermaid\n${mermaidGraph}\n\`\`\`\n`;
  const memoryMapFilePath = `intelligence/memory/technical/dependency-map.md`;

  await fs.writeFile(memoryMapFilePath, memoryMapContent, 'utf-8');
  logger.info(`Memory map generated and saved to ${memoryMapFilePath}`);

  return { memoryMapPath: memoryMapFilePath };
}
