import { Server } from '../types/mcp-sdk.js';
import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

interface WebSearchArgs {
  query: string;
  search_type: 'general' | 'code' | 'documentation' | 'error_solution';
  max_results: number;
}

export async function registerWebSearch(server: Server, config: Config) {
  server.addTool({
    name: 'web_search_enhanced',
    description: 'Enhanced web search with result caching and context integration',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        search_type: {
          type: 'string',
          enum: ['general', 'code', 'documentation', 'error_solution']
        },
        max_results: {
          type: 'number',
          default: 10
        }
      },
      required: ['query', 'search_type']
    },
    handler: async (args: WebSearchArgs) => {
      logger.info(`Performing web search: ${args.query}`);
      
      try {
        // Check cache first
        const cachedResult = await checkCache(args.query);
        if (cachedResult) {
          logger.info('Returning cached result');
          return cachedResult;
        }
        
        // Perform search
        const results = await performSearch(args, config);
        
        // Cache results
        await cacheResults(args.query, results);
        
        return results;
      } catch (error) {
        logger.error('Web search failed', error);
        throw error;
      }
    }
  });
}

async function checkCache(query: string): Promise<any> {
  // TODO: Implement caching
  return null;
}

async function performSearch(args: WebSearchArgs, config: Config) {
  const apiKey = process.env.SERP_API_KEY || config.integrations.serpapi.api_key;
  if (!apiKey) {
    throw new Error('SERP_API_KEY not configured');
  }
  
  const params = new URLSearchParams({
    q: args.query,
    api_key: apiKey,
    num: args.max_results.toString()
  });
  
  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return formatResults(data, args.search_type);
}

async function cacheResults(query: string, results: any) {
  // TODO: Implement caching with 1-hour expiration
}

function formatResults(data: any, searchType: string) {
  // Format results based on search type
  switch (searchType) {
    case 'code':
      return formatCodeResults(data);
    case 'documentation':
      return formatDocResults(data);
    case 'error_solution':
      return formatErrorResults(data);
    default:
      return formatGeneralResults(data);
  }
}

function formatCodeResults(data: any) {
  return {
    type: 'code',
    results: data.organic_results?.map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: result.source
    })) || []
  };
}

function formatDocResults(data: any) {
  return {
    type: 'documentation',
    results: data.organic_results?.map((result: any) => ({
      title: result.title,
      link: result.link,
      description: result.snippet
    })) || []
  };
}

function formatErrorResults(data: any) {
  return {
    type: 'error_solution',
    results: data.organic_results?.map((result: any) => ({
      title: result.title,
      solution: result.snippet,
      reference: result.link
    })) || []
  };
}

function formatGeneralResults(data: any) {
  return {
    type: 'general',
    results: data.organic_results?.map((result: any) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet
    })) || []
  };
}
