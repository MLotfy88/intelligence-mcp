import { Config } from '../utils/config-loader.js';
import { getCodeIntelligenceToolDefinition } from './code-intelligence.js';
import { getMemoryBankToolDefinition } from './memory-bank.js';
import { getWebSearchToolDefinition } from './serpapi.js';
import { getESLintToolDefinition } from './eslint-integration.js';
import { getTypeScriptToolDefinition } from './typescript-integration.js';
import { getSequentialThinkingToolDefinition } from './sequential-thinking.js';
import { getMasterWorkflowToolDefinition } from '../workflows/master-workflow.js';
import { getDailyDigestToolDefinition } from '../workflows/daily-digest.js';
import { getContextCondensingToolDefinition } from '../workflows/context-condensing.js';
import { getConversationSummarizerToolDefinition } from './conversation-summarizer.js';
import { logger } from '../utils/logger.js';

export function getToolDefinitions(config: Config): Array<{ name: string; description: string; schema: object; handler: unknown }> {
  const tools = [
    getCodeIntelligenceToolDefinition(),
    getMemoryBankToolDefinition(config),
    getWebSearchToolDefinition(config),
    getESLintToolDefinition(config),
    getTypeScriptToolDefinition(config),
    getSequentialThinkingToolDefinition(config),
    getMasterWorkflowToolDefinition(config),
    getDailyDigestToolDefinition(config),
    getContextCondensingToolDefinition(config),
    getConversationSummarizerToolDefinition()
  ];
  logger.info('All tool definitions collected successfully');
  return tools;
}
