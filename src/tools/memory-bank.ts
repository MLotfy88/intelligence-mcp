import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { getWebSearchToolDefinition } from './serpapi.js'; // Import SerpAPI tool
import ffmpeg from 'fluent-ffmpeg';

import {
  FileCategory,
  MemoryBankArgs,
  MemoryBankReadResult,
  MemoryBankWriteResult,
  MemoryBankUpdateResult,
  MemoryBankArchiveResult,
  MemoryBankSearchResult,
  MemoryBankExternalSearchResult,
  MemoryBankMultimediaProcessResult,
  MemoryBankAuditResult
} from '../types/memory-bank.d.js';

export function getMemoryBankToolDefinition(_config: Config): { name: string; description: string; schema: object; handler: (args: MemoryBankArgs) => Promise<MemoryBankReadResult | MemoryBankWriteResult | MemoryBankUpdateResult | MemoryBankArchiveResult | MemoryBankSearchResult | MemoryBankExternalSearchResult | MemoryBankMultimediaProcessResult | MemoryBankAuditResult> } {
  return {
    name: 'memory_bank_manager',
    description: 'Manage structured memory files with auto-archiving',
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'write', 'update', 'archive', 'search', 'external_search', 'process_multimedia']
        },
        file_category: {
          type: 'string',
          enum: ['core', 'dynamic', 'planning', 'technical', 'auto_generated']
        },
        file_name: { type: 'string' },
        content: { type: 'string' },
        search_query: { type: 'string' }
      },
      required: ['action'] // Changed to only require action, as file_category is not always needed for external_search
    },
    handler: async (args: MemoryBankArgs): Promise<MemoryBankReadResult | MemoryBankWriteResult | MemoryBankUpdateResult | MemoryBankArchiveResult | MemoryBankSearchResult | MemoryBankExternalSearchResult | MemoryBankMultimediaProcessResult | MemoryBankAuditResult> => {
      logger.info(`Memory bank operation: ${args.action} in category ${args.file_category || 'N/A'}`);
      
      try {
        switch (args.action) {
          case 'read':
            return await readMemoryFile(args, _config);
          case 'write':
            return await writeMemoryFile(args, _config);
          case 'update':
            return await updateMemoryFile(args, _config);
          case 'archive':
            return await archiveFiles(args, _config);
          case 'search':
            return await searchMemoryFiles(args, _config);
          case 'external_search':
            return await externalSearch(args.search_query, _config);
          case 'process_multimedia':
            return await processMultimedia(args, _config);
          case 'audit_daily':
            return await auditDaily(args, _config);
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

async function readMemoryFile(args: MemoryBankArgs, _config: Config): Promise<{ content: string }> {
  const filePath = getFilePath(args.file_category, args.file_name, _config);
  const content = await fs.readFile(filePath, 'utf-8');
  return { content };
}

async function writeMemoryFile(args: MemoryBankArgs, _config: Config): Promise<{ success: boolean; path: string }> {
  if (!args.content) {
    throw new Error('Content is required for write operation');
  }
  
  const filePath = getFilePath(args.file_category, args.file_name, _config);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, args.content);
  
  return { success: true, path: filePath };
}

async function updateMemoryFile(args: MemoryBankArgs, _config: Config): Promise<{ success: boolean; timestamp: string }> {
  if (!args.content) {
    throw new Error('Content is required for update operation');
  }
  
  const filePath = getFilePath(args.file_category, args.file_name, _config);
  const timestamp = new Date().toLocaleString(); // Use toLocaleString for a more readable date/time
  const content = `${args.content}\n\nLast updated: ${timestamp}`;
  
  await fs.writeFile(filePath, content);
  return { success: true, timestamp };
}

async function archiveFiles(args: MemoryBankArgs, _config: Config): Promise<{ archived: Array<{ file: string; archived: string | null; status: string; error?: string }> }> {
  const baseMemoryPath = path.join('.intellicode', 'memory'); // Updated base path
  const sourceCategoryPath = path.join(baseMemoryPath, args.file_category);
  const archiveCategoryPath = path.join(baseMemoryPath, _config.memory.archive.path, args.file_category);
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

async function searchMemoryFiles(args: MemoryBankArgs, _config: Config): Promise<{ results: Array<{ file: string; category: FileCategory; content_preview: string }> }> {
  if (!args.search_query) {
    throw new Error('Search query is required for search operation');
  }

  const results: { file: string; category: FileCategory; content_preview: string }[] = [];
  const targetDirectory = getFilePath(args.file_category, '', _config);

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

async function externalSearch(query: string | undefined, _config: Config): Promise<{ external_results: string[] }> {
  if (!query) {
    throw new Error('Search query is required for external search operation');
  }
  logger.info(`Performing external search for: ${query}`);
  const serpApiTool = getWebSearchToolDefinition(_config);
  const searchResults = await serpApiTool.handler({ query, search_type: 'general', max_results: 5 });
  return { external_results: searchResults.results.map(r => r.snippet || r.title || r.link) };
}

async function processMultimedia(args: MemoryBankArgs, _config: Config): Promise<{ success: boolean; path: string }> {
  if (!args.file_name || !args.content) {
    throw new Error('File name and content (base64 encoded) are required for multimedia processing');
  }

  const inputFilePath = path.join('.intellicode', 'temp', args.file_name);
  const outputFileName = `${path.parse(args.file_name).name}.mp3`;
  const outputFilePath = getFilePath(args.file_category, outputFileName, _config);

  await fs.mkdir(path.dirname(inputFilePath), { recursive: true });
  await fs.writeFile(inputFilePath, Buffer.from(args.content, 'base64'));

  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .toFormat('mp3')
      .on('end', async () => {
        logger.info(`Successfully converted ${args.file_name} to MP3.`);
        await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
        await fs.rename(inputFilePath.replace(path.extname(inputFilePath), '.mp3'), outputFilePath); // Rename the converted file
        resolve({ success: true, path: outputFilePath });
      })
      .on('error', async (err) => {
        logger.error(`Error processing multimedia file ${args.file_name}: ${err.message}`);
        await fs.unlink(inputFilePath).catch(e => logger.error(`Failed to delete temp file: ${e.message}`));
        reject(new Error(`Failed to process multimedia: ${err.message}`));
      })
      .save(inputFilePath.replace(path.extname(inputFilePath), '.mp3')); // Save to a temporary MP3 file first
  });
}

function getFilePath(category: FileCategory, fileName: string, _config: Config): string {
  return path.join('.intellicode', 'memory', category, fileName);
}

async function auditDaily(args: MemoryBankArgs, _config: Config): Promise<{ success: boolean; audit_log_path: string; message: string }> {
  logger.info('Starting daily memory file audit...');
  const auditLogPath = path.join('.intellicode', 'docs', 'memory-audit.md');
  let auditReport = `# Daily Memory Audit Report - ${new Date().toLocaleDateString()}\n\n`;
  let success = true;

  const memoryCategories: FileCategory[] = ['core', 'dynamic', 'planning', 'technical', 'auto_generated'];

  for (const category of memoryCategories) {
    const categoryPath = path.join('.intellicode', 'memory', category);
    auditReport += `## Category: ${category}\n`;
    try {
      const files = await fs.readdir(categoryPath);
      if (files.length === 0) {
        auditReport += `  - No files found in this category.\n`;
      } else {
        for (const file of files) {
          const filePath = path.join(categoryPath, file);
          try {
            const stats = await fs.stat(filePath);
            auditReport += `  - ✅ ${file} (Size: ${stats.size} bytes, Last Modified: ${stats.mtime.toLocaleString()})\n`;
          } catch (fileStatError) {
            auditReport += `  - ❌ ${file} (Error: ${(fileStatError as Error).message})\n`;
            success = false;
          }
        }
      }
    } catch (dirReadError) {
      auditReport += `  - ⚠️ Could not read directory ${categoryPath} (Error: ${(dirReadError as Error).message})\n`;
      success = false;
    }
    auditReport += '\n';
  }

  try {
    await fs.mkdir(path.dirname(auditLogPath), { recursive: true });
    await fs.writeFile(auditLogPath, auditReport);
    logger.info(`Daily memory audit completed. Report saved to ${auditLogPath}`);
    return { success, audit_log_path: auditLogPath, message: 'Daily memory audit completed.' };
  } catch (writeError) {
    logger.error(`Failed to write daily audit log to ${auditLogPath}: ${(writeError as Error).message}`);
    throw new Error(`Failed to write audit log: ${(writeError as Error).message}`);
  }
}
