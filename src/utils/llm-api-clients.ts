import { Config } from './config-loader.js';
import { logger } from './logger.js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// Export actual LLM client types
export type OpenAIClient = OpenAI;
export type GoogleClient = GoogleGenerativeAI;
export type DeepSeekClient = OpenAI; // DeepSeek API is often compatible with OpenAI API
export type AnthropicClient = Anthropic;

export function initializeOpenAIClient(config: Config): OpenAIClient | null {
  if (config.llm_apis?.openai?.api_key) {
    logger.info('Initializing OpenAI client...');
    return new OpenAI({ apiKey: config.llm_apis.openai.api_key });
  }
  logger.warn('OpenAI API key not found in config. OpenAI client not initialized.');
  return null;
}

export function initializeGoogleClient(config: Config): GoogleClient | null {
  if (config.llm_apis?.google?.api_key) {
    logger.info('Initializing Google client...');
    return new GoogleGenerativeAI(config.llm_apis.google.api_key);
  }
  logger.warn('Google API key not found in config. Google client not initialized.');
  return null;
}

export function initializeDeepSeekClient(config: Config): DeepSeekClient | null {
  if (config.llm_apis?.deepseek?.api_key && config.llm_apis?.deepseek?.base_url) {
    logger.info('Initializing DeepSeek client...');
    return new OpenAI({
      apiKey: config.llm_apis.deepseek.api_key,
      baseURL: config.llm_apis.deepseek.base_url,
    });
  }
  logger.warn('DeepSeek LLM preferred but API key or base URL not found. DeepSeek client not initialized.');
  return null;
}

export function initializeAnthropicClient(config: Config): AnthropicClient | null {
  if (config.llm_apis?.anthropic?.api_key) {
    logger.info('Initializing Anthropic client...');
    return new Anthropic({ apiKey: config.llm_apis.anthropic.api_key });
  }
  logger.warn('Anthropic API key not found in config. Anthropic client not initialized.');
  return null;
}