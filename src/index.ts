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
      origin: '*', // Allow all origins for testing. IMPORTANT: Restrict this in production!
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    }));

    const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

    const server = new Server({
      name: "roo-code-intelligence",
      version: "2.1.0",
      tools: tools
    });

    app.post('/mcp', async (req, res) => {
      let sessionId = req.headers['mcp-session-id'] as string;
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        res.setHeader('Mcp-Session-Id', sessionId);
      }
      let transport = transports[sessionId];
      if (!transport) {
        transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => sessionId });
        transports[sessionId] = transport;
        await server.connect(transport);
      }
      await transport.handleRequest(req, res, req.body);
    });

    app.get('/mcp', async (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string;
      if (!sessionId) {
        res.status(400).send('Missing Mcp-Session-Id header');
        return;
      }
      const transport = transports[sessionId];
      if (!transport) {
        res.status(404).send('Session not found');
        return;
      }
      res.setHeader('Content-Type', 'text/event-stream');
      await transport.handleRequest(req, res, null);
    });

    app.delete('/mcp', async (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string;
      if (!sessionId) {
        res.status(400).send('Missing Mcp-Session-Id header');
        return;
      }
      const transport = transports[sessionId];
      if (transport) {
        transport.close();
        delete transports[sessionId];
      }
      res.status(200).send('Session terminated');
    });

    // Handle /api/tool endpoint as well, routing to the same transport
    app.post('/api/tool', async (req, res) => {
      // For /api/tool, we assume a session is already established or it's a stateless call
      // If a session ID is provided, use the existing transport
      const sessionId = req.headers['mcp-session-id'] as string;
      let transport = sessionId ? transports[sessionId] : undefined;

      if (!transport) {
        // If no session or session not found, create a new stateless transport for this request
        transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => Math.random().toString(36).substring(2, 15) }); // Stateless for this specific tool call
        await server.connect(transport); // Connect for this single request
      }
      await transport.handleRequest(req, res, req.body);
      // If stateless, close the transport after handling the request
      if (!sessionId) {
        transport.close();
      }
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