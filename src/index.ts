import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig } from './utils/config-loader.js';
import { getToolDefinitions } from './tools/index.js';
import { getMemoryBankToolDefinition } from './tools/memory-bank.js'; // Import directly
import { handleError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';
import { readFile } from 'fs/promises';
import express from 'express';
import cors from 'cors'; // Import cors

async function main() {
  try {
    const config = await loadConfig();
    if (process.env.SERP_API_KEY) {
      config.integrations.serpapi.api_key = process.env.SERP_API_KEY;
      logger.info('SERP_API_KEY loaded from environment variables');
    }

    // Initialize memory bank with project prompt before server starts
    const mcpPromptContent = await readFile('mcp-server-prompt.md', 'utf-8');
    const memoryBankToolDefinition = getMemoryBankToolDefinition(config); // Get the tool definition
    if (memoryBankToolDefinition && memoryBankToolDefinition.handler) {
      await memoryBankToolDefinition.handler({
        action: 'write',
        file_category: 'core',
        file_name: 'project-brief.md',
        content: mcpPromptContent
      });
      logger.info('Project prompt successfully written to memory bank.');
    } else {
      logger.error('Memory bank manager tool definition or handler is missing.');
    }

    const tools = getToolDefinitions(config);

    const app = express();
    app.use(express.json()); // For parsing application/json

    // Configure CORS for specific origins and methods
    app.use(cors({
      origin: 'http://localhost:3000', // Replace with your frontend origin
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    const server = new Server({
      name: "roo-code-intelligence",
      version: "2.1.0",
      transport: transport,
      tools: tools
    });

    // Handle all requests with the transport
    app.all('/mcp', async (req, res) => {
      await transport.handleRequest(req, res, req.body);
    });

    // Add a basic health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).send('OK');
    });

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(port, () => {
      logger.info(`MCP Server started successfully on port ${port}`);
    });

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