import express, { Request, Response } from 'express';
import { Server, StdioServerTransport } from './types/mcp-sdk.js';
import { loadConfig } from './utils/config-loader.js';
import { registerTools } from './tools/index.js';
import { handleError } from './utils/error-handler.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    const app = express();
    app.use(express.json()); // إضافة لقراءة الـ JSON من الطلبات

    const server = new Server({
      name: "roo-code-intelligence",
      version: "2.1.0",
      transport: new StdioServerTransport()
    });

    const config = await loadConfig();
    if (process.env.SERP_API_KEY) {
      config.integrations.serpapi.api_key = process.env.SERP_API_KEY;
      logger.info('SERP_API_KEY loaded from environment variables');
    }

    await registerTools(server, config);
    await server.start();
    logger.info('MCP Server started successfully');

    const port = parseInt(process.env.PORT || '10000');

    // دعم GET على /health
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).send('Server is running');
    });

    // دعم POST على /health
    app.post('/health', (req: Request, res: Response) => {
      res.status(200).send('Server is running (POST)');
    });

    // دعم POST على /api/tool
    app.post('/api/tool', (req: Request, res: Response) => {
      try {
        const { tool, params } = req.body;
        if (!tool || !params) {
          return res.status(400).send('Tool name and params are required');
        }
        logger.info(`Received tool: ${tool}, params: ${JSON.stringify(params)}`);

        if (tool === 'web_search_enhanced') {
          // منطق مؤقت لحين دمج الأدوات
          logger.info(`Executing ${tool} with params: ${JSON.stringify(params)}`);
          res.status(200).send({ result: 'Tool executed successfully', tool, params });
        } else {
          res.status(400).send('Tool not supported');
        }
      } catch (error) {
        logger.error('Error executing tool', { error: error.message, stack: error.stack });
        res.status(500).send('Internal server error');
      }
    });

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