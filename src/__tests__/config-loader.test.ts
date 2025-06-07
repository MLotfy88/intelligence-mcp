import { loadConfig } from '../utils/config-loader.js';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

describe('Config Loader', () => {
  const configPath = '.roo/code-intelligence.yaml';
  const testConfig = `
version: 2.0
memory:
  enabled: true
  files:
    core: []
    dynamic: []
    planning: []
    technical: []
    auto_generated: []
  archive:
    path: "archive/"
    retention_period: "30d"
`;

  beforeAll(async () => {
    // Ensure config directory exists
    if (!existsSync(dirname(configPath))) {
      await mkdir(dirname(configPath), { recursive: true });
    }
    
    // Write test config
    await writeFile(configPath, testConfig);
  });

  it('should load configuration file', async () => {
    const config = await loadConfig();
    expect(config).toBeDefined();
    expect(config.version).toBe('2.0');
    expect(config.memory.enabled).toBe(true);
    expect(config.memory.archive.retention_period).toBe('30d');
  });
});
