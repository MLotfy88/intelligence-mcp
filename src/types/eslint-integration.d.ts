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

export {
  ESLintArgs,
  LintMessageFix,
  LintMessage,
  LintResult,
  FormattedResult
};