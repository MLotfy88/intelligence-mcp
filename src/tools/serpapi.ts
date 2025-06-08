import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WebSearchArgs } from '../types/serpapi.d.js';

export function getWebSearchToolDefinition(config: Config): { name: string; description: string; schema: any; handler: any } {
  return {
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
        await cacheResults(args.query, results, config.integrations.serpapi.cache_duration);
        
        return results;
      } catch (error) {
        logger.error('Web search failed', error);
        throw error;
      }
    }
  };
}

const CACHE_DIR = 'intelligence/cache/serpapi';

async function checkCache(query: string): Promise<any | null> {
  const cacheFilePath = getCacheFilePath(query);
  try {
    const cacheContent = await fs.readFile(cacheFilePath, 'utf-8');
    const cachedData = JSON.parse(cacheContent);
    const cacheDurationMs = parseDuration(cachedData.cache_duration);

    if (Date.now() - cachedData.timestamp < cacheDurationMs) {
      logger.info(`Cache hit for query: ${query}`);
      return cachedData.results;
    } else {
      logger.info(`Cache expired for query: ${query}`);
      await fs.unlink(cacheFilePath); // Invalidate expired cache
      return null;
    }
  } catch (error) {
    // Cache file not found or invalid, proceed with search
    return null;
  }
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

async function cacheResults(query: string, results: any, cacheDuration = '1h') {
  const cacheFilePath = getCacheFilePath(query);
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const dataToCache = {
    query,
    timestamp: Date.now(),
    cache_duration: cacheDuration,
    results
  };
  await fs.writeFile(cacheFilePath, JSON.stringify(dataToCache, null, 2));
  logger.info(`Results cached for query: ${query}`);
}

function getCacheFilePath(query: string): string {
  const fileName = Buffer.from(query).toString('base64url') + '.json';
  return path.join(CACHE_DIR, fileName);
}

function parseDuration(duration: string): number {
  const value = parseInt(duration.slice(0, -1));
  const unit = duration.slice(-1);
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 1000 * 60;
    case 'h': return value * 1000 * 60 * 60;
    case 'd': return value * 1000 * 60 * 60 * 24;
    default: return 0;
  }
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
