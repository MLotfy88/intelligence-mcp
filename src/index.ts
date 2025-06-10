import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './utils/config-loader.js';
import { getToolDefinitions } from './tools/index.js';
import { getMemoryBankToolDefinition } from './tools/memory-bank.js'; // Import directly
import { handleError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';
import { readFile } from 'fs/promises';
import chokidar from 'chokidar';
import cron from 'node-cron';
import { getSequentialThinkingToolDefinition } from './tools/sequential-thinking.js'; // Import the specific tool definition
import { getDailyDigestToolDefinition } from './workflows/daily-digest.js'; // Import the daily digest tool definition
import { getMemoryMapToolDefinition } from './tools/code-intelligence.js'; // Import the memory map tool definition
import { getConversationSummarizerToolDefinition } from './tools/conversation-summarizer.js'; // Import the conversation summarizer tool definition
import { initializeMemoryBank } from './utils/memory-initializer.js'; // Import the memory initializer

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
      // Pass a context object that includes the callToolFunction itself for nested calls
      return await tool.handler(toolArgs, { call: callToolFunction });
    };

    // Integrate file change monitoring (chokidar)
    const watcher = chokidar.watch(['src/**/*.ts', 'src/**/*.md'], {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    watcher.on('change', async (path) => {
      logger.info(`File ${path} has been changed. Triggering code intelligence analysis.`);
    });

    logger.info('File change monitoring initialized for .ts and .md files in src/.');

    // Schedule periodic tasks (node-cron)
    // Schedule a daily digest generation at a specific time (e.g., 00:00 AM daily)
    cron.schedule('0 0 * * *', async () => {
      logger.info('Generating daily memory digest...');
      const dailyDigestTool = getDailyDigestToolDefinition(config);
      if (dailyDigestTool && typeof dailyDigestTool.handler === 'function') {
        await dailyDigestTool.handler({}, { call: callToolFunction });
        logger.info('Daily memory digest generated successfully.');
      } else {
        logger.error('Daily digest tool definition or handler is missing or not a function.');
      }

      logger.info('Performing daily memory audit...');
      const memoryBankTool = getMemoryBankToolDefinition(config);
      if (memoryBankTool && typeof memoryBankTool.handler === 'function') {
        await memoryBankTool.handler({ action: 'audit_daily', file_category: 'auto_generated', file_name: 'memory-audit.md' });
        logger.info('Daily memory audit completed successfully.');
      } else {
        logger.error('Memory bank manager tool definition or handler is missing or not a function for audit.');
      }
    });
    logger.info('Daily memory digest generation and audit scheduled.');

    // Schedule weekly memory map generation (e.g., every Sunday at 00:00 AM)
    cron.schedule('0 0 * * 0', async () => {
      logger.info('Generating weekly memory map...');
      const memoryMapTool = getMemoryMapToolDefinition();
      if (memoryMapTool && typeof memoryMapTool.handler === 'function') {
        await memoryMapTool.handler({ file_path: 'src/index.ts', phase: 'inspection' });
        logger.info('Weekly memory map generated successfully.');
      } else {
        logger.error('Memory map tool definition or handler is missing or not a function.');
      }
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