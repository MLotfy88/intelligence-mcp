import { logger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import { Config, loadConfig } from '../utils/config-loader.js';
import { getMemoryBankToolDefinition } from './memory-bank.js';

interface ConversationSummarizerArgs {
  conversation_history: string;
  summary_type: 'concise' | 'detailed';
  output_file?: string;
  override_compression_rate?: number;
}

export function getConversationSummarizerToolDefinition(): { name: string; description: string; schema: object; handler: (args: ConversationSummarizerArgs) => Promise<{ summary: string }> } {
  return {
    name: 'conversation_summarizer',
    description: 'Summarizes conversation history and can optionally save it to a file, adhering to priority levels and compression rates.',
    schema: {
      type: 'object',
      properties: {
        conversation_history: {
          type: 'string',
          description: 'The full conversation history to summarize.'
        },
        summary_type: {
          type: 'string',
          enum: ['concise', 'detailed'],
          description: 'The type of summary to generate.'
        },
        output_file: {
          type: 'string',
          description: 'Optional: Path to a markdown file to save the summary.'
        },
        override_compression_rate: {
          type: 'number',
          description: 'Optional: Override the default compression rate (0-1).'
        }
      },
      required: ['conversation_history', 'summary_type']
    },
    handler: async (args: ConversationSummarizerArgs): Promise<{ summary: string }> => {
      logger.info(`Starting conversation summarization with type: ${args.summary_type}`);
      const config: Config = await loadConfig();
      const memoryBankTool = getMemoryBankToolDefinition(config);

      const defaultCompressionRate = config.priorities.default_compression_rate || 0.5;
      const compressionRate = args.override_compression_rate || defaultCompressionRate;

      // 1. Pre-Condensing Backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `context-backup-${timestamp}.md`;
      const backupPath = `${config.memory.archive.path}/${backupFileName}`;
      await memoryBankTool.handler({
        action: 'write',
        file_category: 'auto_generated', // Assuming archive path is part of auto_generated for simplicity
        file_name: backupPath,
        content: args.conversation_history
      });
      logger.info(`Pre-condensing backup saved to ${backupPath}`);

      let p0Content = '';
      let p1Content = '';
      let p2Content = '';

      // Simple keyword-based priority extraction (placeholder for actual NLP/LLM logic)
      const lines = args.conversation_history.split('\n');
      lines.forEach(line => {
        if (line.includes('CODE') || line.includes('Handover Decisions') || line.includes('Project Plan Changes')) {
          p0Content += line + '\n';
        } else if (line.includes('Memory Bank Updates') || line.includes('Critical Conflicts')) {
          p1Content += line + '\n';
        } else {
          p2Content += line + '\n';
        }
      });

      // 2. Tri-Phase Analysis & Dynamic Compression
      // Phase 1: Extract and preserve [P0] items (full retention)
      let summary = `### Critical Actions\n${p0Content}\n`;

      // Phase 2: Summarize [P1] items (partial retention)
      const p1Summary = summarizeContent(p1Content, 1 - (compressionRate * 0.5)); // Less compression for P1
      summary += `### Key Discussions (High Priority)\n${p1Summary}\n`;

      // Phase 3: Reduce [P2] content to semantic summaries
      const p2Summary = summarizeContent(p2Content, 1 - (compressionRate * 0.8)); // More compression for P2
      summary += `### General Discussion\n${p2Summary}\n`;

      // 3. Documentation & Validation Protocol
      const draftFileName = `drafts/session-${new Date().toISOString().split('T')[0]}.md`;
      const draftPath = `${config.memory.files.auto_generated[2]}/${draftFileName}`; // Assuming drafts is the 3rd auto_generated file
      await memoryBankTool.handler({
        action: 'write',
        file_category: 'auto_generated',
        file_name: draftPath,
        content: `[SESSION SUMMARY DRAFT]\n${summary}`
      });
      logger.info(`Draft summary saved to ${draftPath}`);

      // Present for Review (simulated)
      logger.info(`\n[SESSION SUMMARY DRAFT]\nI have condensed our conversation. Before I finalize the log, please review this summary.\n\n${summary}\n\n**Is this summary accurate and complete? Please confirm or suggest edits before I commit.**`);

      // Finalize (requires user confirmation in a real scenario)
      if (args.output_file) {
        await fs.writeFile(args.output_file, summary);
        logger.info(`Finalized summary saved to ${args.output_file}`);
      }

      return { summary: summary };
    }
  };
}

// Placeholder for actual summarization logic (semantic summarization would use an LLM)
function summarizeContent(content: string, retentionRate: number): string {
  const words = content.split(/\s+/);
  const retainedWordCount = Math.floor(words.length * retentionRate);
  return words.slice(0, retainedWordCount).join(' ') + (words.length > retainedWordCount ? '...' : '');
}