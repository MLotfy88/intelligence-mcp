interface WebSearchArgs {
  query: string;
  search_type: 'general' | 'code' | 'documentation' | 'error_solution';
  max_results: number;
}

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  source?: string;
  description?: string;
  solution?: string;
  reference?: string;
}

interface FormattedSearchResults {
  type: 'general' | 'code' | 'documentation' | 'error_solution';
  results: SearchResult[];
}

export {
  WebSearchArgs,
  SearchResult,
  FormattedSearchResults
};