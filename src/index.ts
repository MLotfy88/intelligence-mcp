import express, { Request, Response } from 'express';
import { Server, StdioServerTransport } from './types/mcp-sdk.js';
import { loadConfig } from './utils/config-loader.js';
import { registerTools } from './tools/index.js';
import { handleError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    // Initialize Express app for HTTP layer
    const app = express();

    // Initialize MCP Server with StdioServerTransport
    const server = new Server({
      name: "roo-code-intelligence",
      version: "2.1.0",
      transport: new StdioServerTransport()
    });

    // Load configuration
    const config = await loadConfig();

    // Register all tools
    await registerTools(server, config);

    // Start the MCP server
    await server.start();
    logger.info('MCP Server started successfully');

    // Expose a simple HTTP endpoint for health check
    const port = parseInt(process.env.PORT || '10000'); // تحويل المنفذ لـ number
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).send('Server is running');
    });

    // Start the HTTP server
    app.listen(port, '0.0.0.0', () => {
      logger.info(`HTTP Server started on port ${port}`);
    });
  } catch (error) {
    handleError('Server initialization failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  handleError('Unhandled error in main', error);
  process.exit(1);
});