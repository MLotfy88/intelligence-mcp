import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

type FileCategory = 'core' | 'dynamic' | 'planning' | 'technical' | 'auto_generated';
type MemoryAction = 'read' | 'write' | 'update' | 'archive' | 'search';

interface MemoryBankArgs {
  action: MemoryAction;
  file_category: FileCategory;
  file_name: string;
  content?: string;
  search_query?: string;
}

export function getMemoryBankToolDefinition(config: Config): { name: string; description: string; schema: any; handler: any } {
  return {
    name: 'memory_bank_manager',
    description: 'Manage structured memory files with auto-archiving',
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'write', 'update', 'archive', 'search']
        },
        file_category: {
          type: 'string',
          enum: ['core', 'dynamic', 'planning', 'technical', 'auto_generated']
        },
        file_name: { type: 'string' },
        content: { type: 'string' },
        search_query: { type: 'string' }
      },
      required: ['action', 'file_category']
    },
    handler: async (args: MemoryBankArgs) => {
      logger.info(`Memory bank operation: ${args.action} in category ${args.file_category}`);
      
      try {
        switch (args.action) {
          case 'read':
            return await readMemoryFile(args, config);
          case 'write':
            return await writeMemoryFile(args, config);
          case 'update':
            return await updateMemoryFile(args, config);
          case 'archive':
            return await archiveFiles(args, config);
          case 'search':
            return await searchMemoryFiles(args, config);
          default:
            throw new Error(`Invalid action: ${args.action}`);
        }
      } catch (error) {
        logger.error(`Memory bank operation failed: ${args.action}`, error);
        throw error;
      }
    }
  };
}

async function readMemoryFile(args: MemoryBankArgs, config: Config) {
  const filePath = getFilePath(args.file_category, args.file_name, config);
  const content = await fs.readFile(filePath, 'utf-8');
  return { content };
}

async function writeMemoryFile(args: MemoryBankArgs, config: Config) {
  if (!args.content) {
    throw new Error('Content is required for write operation');
  }
  
  const filePath = getFilePath(args.file_category, args.file_name, config);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, args.content);
  
  return { success: true, path: filePath };
}

async function updateMemoryFile(args: MemoryBankArgs, config: Config) {
  if (!args.content) {
    throw new Error('Content is required for update operation');
  }
  
  const filePath = getFilePath(args.file_category, args.file_name, config);
  const timestamp = new Date().toLocaleString(); // Use toLocaleString for a more readable date/time
  const content = `${args.content}\n\nLast updated: ${timestamp}`;
  
  await fs.writeFile(filePath, content);
  return { success: true, timestamp };
}

async function archiveFiles(args: MemoryBankArgs, config: Config) {
  const archivePath = config.memory.archive.path;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // YYYY-MM-DDTHH-MM-SS-sssZ
  
  // Create archive directory if it doesn't exist
  await fs.mkdir(archivePath, { recursive: true });
  
  // Move files to archive with timestamp
  const sourceDir = getFilePath(args.file_category, '', config);
  const files = await fs.readdir(sourceDir);
  
  const results = await Promise.all(
    files.map(async file => {
      const source = path.join(sourceDir, file);
      const dest = path.join(archivePath, `${file}.${timestamp}`);
      await fs.rename(source, dest);
      return { file, archived: dest };
    })
  );
  
  return { archived: results };
}

async function searchMemoryFiles(args: MemoryBankArgs, config: Config) {
  if (!args.search_query) {
    throw new Error('Search query is required for search operation');
  }
  
  const results = [];
  const categories = config.memory.files[args.file_category];
  
  for (const category of categories) {
    const files = await fs.readdir(category);
    for (const file of files) {
      const content = await fs.readFile(path.join(category, file), 'utf-8');
      if (content.includes(args.search_query)) {
        results.push({ file, category });
      }
    }
  }
  
  return { results };
}

function getFilePath(category: FileCategory, fileName: string, config: Config): string {
  return path.join('intelligence', 'memory', category, fileName);
}
