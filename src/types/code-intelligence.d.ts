type Phase = 'inspection' | 'diagnosis' | 'execution' | 'all';
type PriorityLevel = 'P0' | 'P1' | 'P2';

interface CodeIntelligenceArgs {
  phase: Phase;
  file_path: string;
  context_files?: string[];
  priority_level?: PriorityLevel;
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

type AnalysisResult = InspectionResult | DiagnosisResult | ExecutionResult;

export {
  Phase,
  PriorityLevel,
  CodeIntelligenceArgs,
  InspectionResult,
  DiagnosisResult,
  ExecutionResult,
  AnalysisResult
};