import { Server } from '../types/mcp-sdk.js';
import { Config } from '../utils/config-loader.js';

describe('MCP Server', () => {
  let server: Server;
  let config: Config;

  beforeEach(() => {
    server = new Server({
      name: 'test-server',
      version: '1.0.0'
    });
  });

  it('should initialize server', () => {
    expect(server).toBeDefined();
    expect(server.name).toBe('test-server');
  });

  it('should register tools', async () => {
    const mockTool = {
      name: 'test-tool',
      description: 'A test tool',
      schema: {
        type: 'object',
        properties: {
          test: { type: 'string' }
        }
      },
      handler: jest.fn()
    };

    server.addTool(mockTool);
    expect(server.allTools).toHaveLength(1);
  });
});
