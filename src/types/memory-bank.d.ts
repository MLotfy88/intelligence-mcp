type FileCategory = 'core' | 'dynamic' | 'planning' | 'technical' | 'auto_generated';
type MemoryAction = 'read' | 'write' | 'update' | 'archive' | 'search';

interface MemoryBankArgs {
  action: MemoryAction;
  file_category: FileCategory;
  file_name: string;
  content?: string;
  search_query?: string;
}

export {
  FileCategory,
  MemoryAction,
  MemoryBankArgs
};