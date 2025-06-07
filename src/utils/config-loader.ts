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
    };
    typescript: {
      tsconfig_path: string;
      check_on_save: boolean;
    };
  };
}

export async function loadConfig(): Promise<Config> {
  try {
    const configPath = '.roo/code-intelligence.yaml';
    const configContent = await readFile(configPath, 'utf-8');
    return parse(configContent) as Config;
  } catch (error) {
    logger.error('Failed to load configuration', error);
    throw new Error('Configuration loading failed');
  }
}
