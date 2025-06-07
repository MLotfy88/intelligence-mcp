import { Server } from '../types/mcp-sdk.js';
import { Config } from '../utils/config-loader.js';
import { registerCodeIntelligence } from './code-intelligence.js';
import { registerMemoryBank } from './memory-bank.js';
import { registerWebSearch } from './serpapi.js';
import { registerESLint } from './eslint-integration.js';
import { registerTypeScript } from './typescript-integration.js';
import { MasterWorkflow } from '../workflows/master-workflow.js';
import { logger } from '../utils/logger.js';

export async function registerTools(server: Server, config: Config) {
  try {
    // Register core tools
    await registerCodeIntelligence(server, config);
    await registerMemoryBank(server, config);
    await registerWebSearch(server, config);
    await registerESLint(server, config);
    await registerTypeScript(server, config);
    
    // Register workflow
    const masterWorkflow = new MasterWorkflow(server, config);
    await masterWorkflow.register();
    
    logger.info('All tools and workflows registered successfully');
  } catch (error) {
    logger.error('Failed to register tools', error);
    throw error;
  }
}
