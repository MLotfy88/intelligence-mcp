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
  llm_apis: {
    preferred_llm?: 'openai' | 'google' | 'deepseek' | 'anthropic';
    openai?: {
      api_key: string;
      base_url?: string;
    };
    google?: {
      api_key: string;
      base_url?: string;
    };
    deepseek?: {
      api_key: string;
      base_url?: string;
    };
    anthropic?: {
      api_key: string;
      base_url?: string;
    };
  };
}

export async function loadConfig(): Promise<Config> {
  try {
    const configPath = '.intellicode/code-intelligence.yaml';
    const configContent = await readFile(configPath, 'utf-8');
    const config = parse(configContent) as Config;

    // Override serpapi.api_key with environment variable if available
    if (process.env.SERP_API_KEY) {
      config.integrations.serpapi.api_key = process.env.SERP_API_KEY;
      logger.info('SERP_API_KEY loaded from environment variables');
    } else {
      logger.warn('SERP_API_KEY not found in environment, using config file value');
    }

    // Override LLM API keys with environment variables if available
    if (process.env.OPENAI_API_KEY && config.llm_apis.openai) {
      config.llm_apis.openai.api_key = process.env.OPENAI_API_KEY;
      logger.info('OPENAI_API_KEY loaded from environment variables');
    }
    if (process.env.GOOGLE_API_KEY && config.llm_apis.google) {
      config.llm_apis.google.api_key = process.env.GOOGLE_API_KEY;
      logger.info('GOOGLE_API_KEY loaded from environment variables');
    }
    if (process.env.DEEPSEEK_API_KEY && config.llm_apis.deepseek) {
      config.llm_apis.deepseek.api_key = process.env.DEEPSEEK_API_KEY;
      logger.info('DEEPSEEK_API_KEY loaded from environment variables');
    }
    if (process.env.ANTHROPIC_API_KEY && config.llm_apis.anthropic) {
      config.llm_apis.anthropic.api_key = process.env.ANTHROPIC_API_KEY;
      logger.info('ANTHROPIC_API_KEY loaded from environment variables');
    }

    return config;
  } catch (error) {
    logger.error('Failed to load configuration', error);
    throw new Error('Configuration loading failed');
  }
}