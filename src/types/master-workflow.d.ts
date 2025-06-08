interface WorkflowArgs {
  workflow_type: 'full_analysis' | 'quick_check' | 'context_condensing' | 'daily_digest';
  target_files: string[];
  priority_override?: 'P0' | 'P1' | 'P2';
  include_web_search?: boolean;
}

export {
  WorkflowArgs
};