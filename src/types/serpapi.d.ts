interface WebSearchArgs {
  query: string;
  search_type: 'general' | 'code' | 'documentation' | 'error_solution';
  max_results: number;
}

interface SerpApiOrganicResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

interface SerpApiResult {
  organic_results?: SerpApiOrganicResult[];
  // Add other top-level properties from SerpAPI response if needed
}

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  source?: string;
  description?: string;
  solution?: string;
}

interface FormattedSearchResults {
  type: 'general' | 'code' | 'documentation' | 'error_solution';
  results: SearchResult[];
}

export {
  WebSearchArgs,
  SearchResult,
  FormattedSearchResults,
  SerpApiOrganicResult,
  SerpApiResult
};