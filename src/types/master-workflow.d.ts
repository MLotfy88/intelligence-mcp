interface WorkflowArgs {
 workflow_type: 'full_analysis' | 'quick_check' | 'context_condensing' | 'daily_digest' | 'generate_memory_map';
 target_files?: string[];
 priority_override?: 'P0' | 'P1' | 'P2';
 include_web_search?: boolean;
}

interface DiagnosisResult {
 message: string;
 // Add other properties as they become known from the actual diagnosis tool output
}

interface DiagnosisResults {
 errors?: DiagnosisResult[];
 warnings?: DiagnosisResult[];
 suggestions?: DiagnosisResult[];
 webContext?: unknown; // This will be populated by web search results
}

interface LintSummary {
 totalErrors: number;
 totalWarnings: number;
 // Add other properties as they become known from the actual linting tool output
}

interface LintResults {
 summary?: LintSummary;
 // Add other properties as they become known from the actual linting tool output
}

interface TypeScriptSummary {
 errorCount: number;
 // Add other properties as they become known from the actual TypeScript tool output
}

interface TypeScriptResults {
 summary?: TypeScriptSummary;
 // Add other properties as they become known from the actual TypeScript tool output
}

export {
 WorkflowArgs,
 DiagnosisResults,
 LintResults,
 TypeScriptResults
};