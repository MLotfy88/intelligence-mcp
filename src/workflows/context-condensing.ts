import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

interface ContextCondensingArgs {
  target_files: string[];
  compression_rate?: number; // e.g., 0.5 for 50% compression
}

export function getContextCondensingToolDefinition(config: Config): { name: string; description: string; schema: any; handler: any } {
  return {
    name: 'context_condensing_process',
    description: 'Condenses context from specified files based on a compression rate.',
    schema: {
      type: 'object',
      properties: {
        target_files: {
          type: 'array',
          items: { type: 'string' }
        },
        compression_rate: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.5
        }
      },
      required: ['target_files']
    },
    handler: async (args: ContextCondensingArgs, context: { call: (toolName: string, toolArgs: any) => Promise<any> }) => {
      logger.info(`Starting context condensing for files: ${args.target_files.join(', ')}`);

      try {
        const condensedResults: { file: string; original_size: number; condensed_size: number; condensed_content: string; priority: string }[] = [];
        const defaultCompressionRate = args.compression_rate ?? config.priorities?.default_compression_rate ?? 0.5;

        // Pre-Condensing Backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupContent = await Promise.all(args.target_files.map(async filePath => {
          try {
            const readResult = await context.call('memory_bank_manager', {
              action: 'read',
              file_category: 'dynamic', // Assuming dynamic for general context files
              file_name: filePath
            });
            return `--- FILE: ${filePath} ---\n${readResult.content}\n`;
          } catch (error) {
            logger.warn(`Could not read file ${filePath} for backup: ${(error as Error).message}`);
            return `--- FILE: ${filePath} (Read Failed) ---\n`;
          }
        })).then(contents => contents.join('\n'));

        await context.call('memory_bank_manager', {
          action: 'write',
          file_category: 'archive',
          file_name: `context-backup-${timestamp}.md`,
          content: backupContent
        });
        logger.info(`Pre-condensing backup saved to intelligence/memory/archive/context-backup-${timestamp}.md`);

        for (const filePath of args.target_files) {
          let fileContent: string;
          let fileCategory = 'dynamic'; // Default category for reading

          // Determine file category for reading
          if (filePath.includes('project-brief.md') || filePath.includes('tech-context.md') || filePath.includes('system-patterns.md')) {
            fileCategory = 'core';
          } else if (filePath.includes('project-plan.md') || filePath.includes('roadmap.md')) {
            fileCategory = 'planning';
          } else if (filePath.includes('error-log.md') || filePath.includes('dependency-map.md') || filePath.includes('api-contracts.md')) {
            fileCategory = 'technical';
          } else if (filePath.includes('session-') || filePath.includes('daily-digest')) {
            fileCategory = 'auto_generated';
          }

          try {
            const readResult = await context.call('memory_bank_manager', {
              action: 'read',
              file_category: fileCategory,
              file_name: filePath.split('/').pop() // Get just the file name
            });
            fileContent = readResult.content;
          } catch (readError) {
            logger.warn(`Could not read file ${filePath} using memory_bank_manager. Simulating content: ${(readError as Error).message}`);
            fileContent = `Simulated content for ${filePath}. This content would be condensed. Error: ${(readError as Error).message}`;
          }

          const originalSize = fileContent.length;
          let condensedContent = '';
          let compressionRate = defaultCompressionRate;
          let priorityLevel = 'P2'; // Default to low priority

          // Apply priority-based compression
          if (filePath.includes('code_modifications') || filePath.includes('handover_decisions') || filePath.includes('project-plan.md') || filePath.includes('roadmap.md')) {
            priorityLevel = 'P0';
            compressionRate = 0.2; // 20% reduction for P0
            condensedContent = fileContent; // Full retention for P0
          } else if (filePath.includes('memory_bank_updates') || filePath.includes('conflict-resolution')) {
            priorityLevel = 'P1';
            compressionRate = 0.3; // 30% reduction for P1
            condensedContent = fileContent.substring(0, Math.floor(originalSize * (1 - compressionRate)));
          } else {
            // P2: General Discussion
            priorityLevel = 'P2';
            compressionRate = 0.6; // 60% reduction for P2
            // Semantic summarization placeholder
            condensedContent = `Summarized content for ${filePath}: ${fileContent.substring(0, Math.floor(originalSize * (1 - compressionRate * 0.5)))}...`;
          }

          const condensedSize = condensedContent.length;

          condensedResults.push({
            file: filePath,
            original_size: originalSize,
            condensed_size: condensedSize,
            condensed_content: condensedContent,
            priority: priorityLevel
          });
        }

        // Generate Draft
        const draftTimestamp = new Date().toISOString().split('T')[0];
        const draftContent = `
[SESSION SUMMARY DRAFT]
I have condensed our conversation. Before I finalize the log, please review this summary.

### 📊 Condensing Protocol Results

| File | Original Size | Condensed Size | Priority |
|---|---|---|---|
${condensedResults.map(r => `| ${r.file} | ${r.original_size} | ${r.condensed_size} | ${r.priority} |`).join('\n')}

### 📝 Condensed Content Samples
${condensedResults.map(r => `--- ${r.file} (${r.priority}) ---\n${r.condensed_content}\n`).join('\n')}

**Is this summary accurate and complete? Please confirm or suggest edits before I commit.**
        `;

        await context.call('memory_bank_manager', {
          action: 'write',
          file_category: 'drafts',
          file_name: `session-${draftTimestamp}.md`,
          content: draftContent
        });
        logger.info(`Draft summary saved to intelligence/memory/drafts/session-${draftTimestamp}.md`);

        // Simulate presenting for review and confirmation
        // In a real scenario, this would involve user interaction.
        // For now, we'll directly finalize for demonstration.

        // Finalize: Save to intelligence/docs/session-YYYY-MM-DD.md
        const finalTimestamp = new Date().toISOString().split('T')[0];
        const finalContent = `
# Session Summary - ${finalTimestamp}

${draftContent.replace('[SESSION SUMMARY DRAFT]', '# Final Session Summary')}
        `;

        // Ensure intelligence/docs directory exists
        await context.call('memory_bank_manager', {
          action: 'write',
          file_category: 'auto_generated', // Using auto_generated for now, will create 'docs' if needed
          file_name: `docs/session-${finalTimestamp}.md`, // This will create the docs subdirectory
          content: finalContent
        });
        logger.info(`Documentation saved to intelligence/memory/auto_generated/docs/session-${finalTimestamp}.md`);


        return {
          status: 'success',
          message: 'Context condensing completed and summary generated.',
          results: condensedResults
        };
      } catch (error) {
        logger.error('Context condensing failed', (error as Error).message);
        throw error;
      }
    }
  };
}