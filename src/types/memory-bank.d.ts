type FileCategory = 'core' | 'dynamic' | 'planning' | 'technical' | 'auto_generated';
type MemoryAction = 'read' | 'write' | 'update' | 'archive' | 'search' | 'external_search' | 'process_multimedia' | 'audit_daily';

interface MemoryBankArgs {
  action: MemoryAction;
  file_category: FileCategory;
  file_name: string;
  content?: string;
  search_query?: string;
}

interface MemoryBankReadResult {
  content: string;
}

interface MemoryBankWriteResult {
  success: boolean;
  path: string;
}

interface MemoryBankUpdateResult {
  success: boolean;
  timestamp: string;
}

interface MemoryBankArchiveResult {
  archived: Array<{ file: string; archived: string | null; status: string; error?: string }>;
}

interface MemoryBankSearchResult {
  results: Array<{ file: string; category: FileCategory; content_preview: string }>;
}

interface MemoryBankExternalSearchResult {
  external_results: string[];
}

interface MemoryBankMultimediaProcessResult {
  success: boolean;
  path: string;
}

interface MemoryBankAuditResult {
  success: boolean;
  audit_log_path: string;
  message: string;
}

export {
  FileCategory,
  MemoryAction,
  MemoryBankArgs,
  MemoryBankReadResult,
  MemoryBankWriteResult,
  MemoryBankUpdateResult,
  MemoryBankArchiveResult,
  MemoryBankSearchResult,
  MemoryBankExternalSearchResult,
  MemoryBankMultimediaProcessResult,
  MemoryBankAuditResult
};