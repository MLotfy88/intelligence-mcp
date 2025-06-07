export interface Tool {
  name: string;
  description: string;
  schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

export class Server {
  constructor(private options: { name: string; version: string; transport?: any }) {}

  get name(): string {
    return this.options.name;
  }

  get version(): string {
    return this.options.version;
  }

  private tools = new Map<string, Tool>();

  async start(): Promise<void> {
    return Promise.resolve();
  }

  addTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async call(toolName: string, args: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    return tool.handler(args);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  get allTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export class StdioServerTransport {
  constructor() {
    // Mock implementation
  }
}

export default Server;
