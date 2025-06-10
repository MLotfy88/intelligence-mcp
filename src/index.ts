import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './utils/config-loader.js';
import { getToolDefinitions } from './tools/index.js';
import { handleError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';
import chokidar from 'chokidar';
import cron from 'node-cron';
import { initializeMemoryBank } from './utils/memory-initializer.js';

async function main(): Promise<void> {
  try {
    const config = await loadConfig();

    let conversationHistory: string[] = [];
    let messageCount = 0;
    if (process.env.SERP_API_KEY) {
      config.integrations.serpapi.api_key = process.env.SERP_API_KEY;
      logger.info('SERP_API_KEY loaded from environment variables');
    }

    // Initialize the memory bank for the user's project
    await initializeMemoryBank(config);
    logger.info('Memory bank initialization checked and completed if necessary.');

    const tools = getToolDefinitions(config);

    const transport = new StdioServerTransport();
    const server = new Server({
      name: "IntelliCodeMCP",
      version: "2.1.0",
      tools: tools
    });

    await server.connect(transport);
    logger.info('MCP Server connected via StdioServerTransport.');

    // Define a helper function to call tools internally
    const callToolFunction = async (toolName: string, toolArgs: Record<string, unknown>): Promise<unknown> => {
      const tool = tools.find(t => t.name === toolName);
      if (!tool || typeof tool.handler !== 'function') {
        throw new Error(`Tool '${toolName}' not found or does not have a handler.`);
      }
      return await tool.handler(toolArgs, { call: callToolFunction });
    };

    // Handle incoming messages via stdin
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (data: string) => {
      const message = data.trim();
      if (message) {
        conversationHistory.push(message);
        messageCount++;
        logger.info(`Received message #${messageCount}: ${message}`);

        if (messageCount >= 100) { // Trigger summarization at 100 messages
          callToolFunction('conversation_summarizer', {
            conversation_history: conversationHistory.join('\n'),
            summary_type: 'detailed'
          }).catch(error => handleError('Conversation summarization failed', error));
          conversationHistory = []; // Reset history
          messageCount = 0; // Reset counter
          logger.info('Conversation summarization triggered.');
        }
      }
    });

    // Integrate file change monitoring (chokidar)
    const watcher = chokidar.watch(['src/**/*.ts', 'src/**/*.md'], {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    watcher.on('change', async (path) => {
      logger.info(`File ${path} has been changed. Triggering roo_code_workflow quick check.`);
      await callToolFunction('roo_code_workflow', { workflow_type: 'quick_check', target_files: [path] }).catch(error => handleError(`Quick check for ${path} failed`, error));
    });

    logger.info('File change monitoring initialized for .ts and .md files in src/.');

    // Schedule periodic tasks (node-cron)
    cron.schedule('0 0 * * *', async () => {
      logger.info('Generating daily memory digest and performing daily memory audit...');
      await callToolFunction('roo_code_workflow', { workflow_type: 'daily_digest' }).catch(error => handleError('Daily memory digest generation failed', error));
      await callToolFunction('memory_bank_manager', { action: 'audit_daily', file_category: 'auto_generated', file_name: 'memory-audit.md' }).catch(error => handleError('Daily memory audit failed', error));
      logger.info('Daily memory digest and audit completed successfully.');
    });
    logger.info('Daily memory digest generation and audit scheduled.');

    cron.schedule('0 0 * * 0', async () => {
      logger.info('Generating weekly memory map...');
      await callToolFunction('roo_code_workflow', { workflow_type: 'generate_memory_map', target_files: ['src/index.ts'] }).catch(error => handleError('Weekly memory map generation failed', error));
      logger.info('Weekly memory map generated successfully.');
    });
    logger.info('Weekly memory map generation scheduled.');

  } catch (error: unknown) {
    const err = error as Error;
    handleError('Server initialization failed', err);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const err = error as Error;
  handleError('Unhandled error in main', err);
  process.exit(1);
});