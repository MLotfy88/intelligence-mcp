interface TypeScriptArgs {
  file_path: string;
  check_type: 'syntax' | 'semantic' | 'all';
  include_suggestions: boolean;
}

interface TypeScriptDiagnostic {
  message: string;
  category: string;
  code: number;
  position: {
    line: number;
    column: number;
  };
  file?: string;
}

interface DiagnosticResult {
  diagnostics: {
    errors: TypeScriptDiagnostic[];
    warnings: TypeScriptDiagnostic[];
    suggestions: TypeScriptDiagnostic[];
  };
  summary: {
    errorCount: number;
    warningCount: number;
    suggestionCount: number;
  };
}

export {
  TypeScriptArgs,
  TypeScriptDiagnostic,
  DiagnosticResult
};