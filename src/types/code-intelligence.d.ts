type Phase = 'inspection' | 'diagnosis' | 'execution' | 'all';
type PriorityLevel = 'P0' | 'P1' | 'P2';

interface CodeIntelligenceArgs {
  phase: Phase;
  file_path: string;
  context_files?: string[];
  priority_level?: PriorityLevel;
  diagnosis_results?: DiagnosisResult; // Add diagnosis_results to the arguments
}

interface InspectionResult {
  phase: 'inspection';
  fileContent: string | null;
  ast: ts.SourceFile | null;
  metrics: {
    complexity: number;
    dependencies: string[];
  };
}

interface DiagnosisResult {
  phase: 'diagnosis';
  errors: Array<{
    message: string;
    line: number;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    message: string;
    line: number;
    severity: 'warning';
  }>;
  suggestions: Array<{
    message: string;
    line: number;
  }>;
}

interface ExecutionResult {
  phase: 'execution';
  solutions: Array<{
    type: string;
    description: string;
    code?: string;
  }>;
  priority: PriorityLevel;
}

interface ConflictResult {
  conflicts: Array<{
    message: string;
    type: 'schema_break' | 'plan_violation' | 'unsafe_type';
    priority: 'P0' | 'P1' | 'P2';
  }>;
}

interface MemoryMapResult {
  memoryMapPath: string;
}

type AnalysisResult = InspectionResult | DiagnosisResult | ExecutionResult | ConflictResult | MemoryMapResult;

export {
  Phase,
  PriorityLevel,
  CodeIntelligenceArgs,
  InspectionResult,
  DiagnosisResult,
  ExecutionResult,
  ConflictResult,
  AnalysisResult,
  MemoryMapResult
};