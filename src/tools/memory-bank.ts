import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

import {
  FileCategory,
  MemoryAction,
  MemoryBankArgs
} from '../types/memory-bank.d.js';

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
  const baseMemoryPath = path.join('intelligence', 'memory');
  const sourceCategoryPath = path.join(baseMemoryPath, args.file_category);
  const archiveCategoryPath = path.join(baseMemoryPath, config.memory.archive.path, args.file_category);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  await fs.mkdir(archiveCategoryPath, { recursive: true });

  const files = await fs.readdir(sourceCategoryPath);

  const results = await Promise.all(
    files.map(async file => {
      const sourceFilePath = path.join(sourceCategoryPath, file);
      const destFilePath = path.join(archiveCategoryPath, `${file}.${timestamp}`);
      try {
        await fs.rename(sourceFilePath, destFilePath);
        return { file, archived: destFilePath, status: 'success' };
      } catch (error) {
        logger.error(`Failed to archive file ${sourceFilePath}: ${(error as Error).message}`);
        return { file, archived: null, status: 'failed', error: (error as Error).message };
      }
    })
  );

  return { archived: results };
}

async function searchMemoryFiles(args: MemoryBankArgs, config: Config) {
  if (!args.search_query) {
    throw new Error('Search query is required for search operation');
  }

  const results: { file: string; category: FileCategory; content_preview: string }[] = [];
  const targetDirectory = getFilePath(args.file_category, '', config);

  try {
    const filesInDirectory = await fs.readdir(targetDirectory);

    for (const file of filesInDirectory) {
      const filePath = path.join(targetDirectory, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.includes(args.search_query)) {
          // Provide a content preview for context
          const previewIndex = content.indexOf(args.search_query);
          const previewStart = Math.max(0, previewIndex - 50);
          const previewEnd = Math.min(content.length, previewIndex + args.search_query.length + 50);
          const content_preview = content.substring(previewStart, previewEnd);

          results.push({
            file: file,
            category: args.file_category,
            content_preview: content_preview
          });
        }
      } catch (fileReadError) {
        logger.warn(`Could not read file ${filePath} during search: ${(fileReadError as Error).message}`);
      }
    }
  } catch (dirReadError) {
    logger.error(`Could not read directory ${targetDirectory} for search: ${(dirReadError as Error).message}`);
    throw dirReadError;
  }

  return { results };
}

function getFilePath(category: FileCategory, fileName: string, config: Config): string {
  return path.join('intelligence', 'memory', category, fileName);
}
