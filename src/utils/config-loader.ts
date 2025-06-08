import { parse } from 'yaml';
import { readFile } from 'fs/promises';
import { logger } from './logger.js';

export interface Config {
  version: string;
  memory: {
    enabled: boolean;
    files: {
      core: string[];
      dynamic: string[];
      planning: string[];
      technical: string[];
      auto_generated: string[];
    };
    archive: {
      path: string;
      retention_period: string;
    };
  };
  priorities: {
    P0: string[];
    P1: string[];
    P2: string[];
    default_compression_rate?: number;
  };
  integrations: {
    serpapi: {
      api_key: string;
      rate_limit: number;
      cache_duration: string;
    };
    eslint: {
      config_path: string;
      auto_fix: boolean;
      severity_threshold: string;
    };
    typescript: {
      tsconfig_path: string;
      check_on_save: boolean;
      diagnostic_level: string;
    };
    sequential_thinking: {
      enabled: boolean;
      max_depth: number;
      timeout: string;
    };
  };
}

export async function loadConfig(): Promise<Config> {
  try {
    const configPath = '.roo/code-intelligence.yaml';
    const configContent = await readFile(configPath, 'utf-8');
    const config = parse(configContent) as Config;

    // Override serpapi.api_key with environment variable if available
    if (process.env.SERP_API_KEY) {
      config.integrations.serpapi.api_key = process.env.SERP_API_KEY;
      logger.info('SERP_API_KEY loaded from environment variables');
    } else {
      logger.warn('SERP_API_KEY not found in environment, using config file value');
    }

    return config;
  } catch (error) {
    logger.error('Failed to load configuration', error);
    throw new Error('Configuration loading failed');
  }
}