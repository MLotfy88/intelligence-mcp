interface WebSearchArgs {
  query: string;
  search_type: 'general' | 'code' | 'documentation' | 'error_solution';
  max_results: number;
}

export {
  WebSearchArgs
};