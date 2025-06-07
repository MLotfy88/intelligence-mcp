import { Server, StdioServerTransport } from './types/mcp-sdk.js';
import { loadConfig } from './utils/config-loader.js';
import { registerTools } from './tools/index.js';
import { handleError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    // Initialize server
    const server = new Server({
      name: "roo-code-intelligence",
      version: "2.1.0",
      transport: new StdioServerTransport()
    });

    // Load configuration
    const config = await loadConfig();

    // Register all tools
    await registerTools(server, config);

    // Start server
    await server.start();
    logger.info('MCP Server started successfully');
  } catch (error) {
    handleError('Server initialization failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  handleError('Unhandled error in main', error);
  process.exit(1);
});
