import { logger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import { Config, loadConfig } from '../utils/config-loader.js';
import { getMemoryBankToolDefinition } from './memory-bank.js';
import {
  initializeOpenAIClient,
  initializeGoogleClient,
  initializeDeepSeekClient,
  initializeAnthropicClient
} from '../utils/llm-api-clients.js';
import { Message } from '@anthropic-ai/sdk/resources/messages';

interface ConversationSummarizerArgs {
  conversation_history: string;
  summary_type: 'concise' | 'detailed';
  output_file?: string;
  override_compression_rate?: number;
}
// New function to filter conversation history based on user's requirements
function filterConversationHistory(history: string): string {
  const lines = history.split('\n');
  const filteredLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Toggle code block status
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      filteredLines.push(line); // Always keep code block delimiters
      continue;
    }

    // Always retain user/model dialogue
    if (line.startsWith('User:') || line.startsWith('Model:')) {
      filteredLines.push(line);
      continue;
    }

    // Retain file modification indicators (diffs, file write results)
    if (line.includes('<<<<<<< SEARCH') || line.includes('>>>>>>> REPLACE') || line.includes('<file_write_result>')) {
      filteredLines.push(line);
      continue;
    }

    // Retain memory bank reads (assuming memory bank files are in .intellicode/memory or similar)
    if (line.includes('<read_file>') && line.includes('.intellicode/memory/')) {
      filteredLines.push(line);
      continue;
    }

    // Discard large code file reads (e.g., from src/, dist/)
    if (line.includes('<file>') && !line.includes('.intellicode/memory/') && !line.includes('<<<<<<< SEARCH') && !line.includes('>>>>>>> REPLACE')) {
      continue;
    }

    // Discard indexing information (list_files, list_code_definition_names, search_files results)
    if (line.includes('<list_files>') || line.includes('<list_code_definition_names>') || line.includes('<search_files>') ||
        line.includes('Directory path here') || line.includes('File path here') || line.includes('Your regex pattern here')) {
      continue;
    }

    // If inside a code block and not explicitly retained by other rules, keep it.
    if (inCodeBlock) {
      filteredLines.push(line);
      continue;
    }

    // If none of the above, keep the line (general conversation, non-tool output)
    filteredLines.push(line);
  }

  return filteredLines.join('\n');
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
      const compressionRate = args.override_compression_rate !== undefined ? args.override_compression_rate : defaultCompressionRate;

      // 1. Pre-Condensing Backup (Preservation Hierarchy P0)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `session-backup-${timestamp}.md`;
      // Ensure the backup path is within .intellicode/archive/auto_generated
      const backupPath = `archive/auto_generated/${backupFileName}`;
      await memoryBankTool.handler({
        action: 'write',
        file_category: 'auto_generated',
        file_name: backupPath,
        content: args.conversation_history
      });
      logger.info(`Pre-condensing backup saved to .intellicode/${backupPath}`);

      // Filter conversation history based on user's requirements
      const filteredHistory = filterConversationHistory(args.conversation_history);

      let p0Content = '';
      let p1Content = '';
      let p2Content = '';

      // 2. Priority-based Content Extraction (Preservation Hierarchy)
      const p0Keywords = config.priorities.P0 || [];
      const p1Keywords = config.priorities.P1 || [];
      const p2Keywords = config.priorities.P2 || [];

      const lines = filteredHistory.split('\n'); // Use filtered history
      lines.forEach((line: string) => {
        const lowerCaseLine = line.toLowerCase();
        if (p0Keywords.some(keyword => lowerCaseLine.includes(keyword.toLowerCase()))) {
          p0Content += line + '\n';
        } else if (p1Keywords.some(keyword => lowerCaseLine.includes(keyword.toLowerCase()))) {
          p1Content += line + '\n';
        } else if (p2Keywords.some(keyword => lowerCaseLine.includes(keyword.toLowerCase()))) {
          p2Content += line + '\n';
        } else {
          // Default to P2 if no specific keyword is found
          p2Content += line + '\n';
        }
      });

      // 3. Tri-Phase Analysis & Dynamic Compression (Condensing Protocol)
      // Phase 1: Extract and preserve [P0] items (full retention)
      let summary = `### Critical Actions\n${p0Content.trim()}\n\n`;

      // Phase 2: Summarize [P1] items (partial retention - apply compressionRate)
      const p1RetentionRate = 1 - (compressionRate * 0.2); // 20% of compressionRate applied to P1
      const p1Summary = summarizeContent(p1Content, p1RetentionRate);
      summary += `### Key Discussions (High Priority)\n${p1Summary.trim()}\n\n`;

      // Phase 3: Reduce [P2] content to semantic summaries (apply compressionRate)
      const p2RetentionRate = 1 - (compressionRate * 0.4); // 40% of compressionRate applied to P2
      const p2Summary = summarizeContent(p2Content, p2RetentionRate);
      summary += `### General Discussion\n${p2Summary.trim()}\n\n`;

      // 4. Documentation Protocol (Structured Summary Generation)
      const summaryDate = new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
      let finalSummaryContent = `[SESSION SUMMARY DRAFT]\n\n### 🗓️ Summary Date: ${summaryDate}\n\n${summary}`;

      // Enhance summary with LLM if configured (Task 8.2)
      finalSummaryContent = await enhanceSummaryWithLLM(finalSummaryContent, config);

      // If output_file is provided, save the summary to that file
      if (args.output_file) {
        try {
          await fs.writeFile(args.output_file, finalSummaryContent);
          logger.info(`Summary also saved to specified output file: ${args.output_file}`);
        } catch (error) {
          logger.error(`Failed to write summary to output file ${args.output_file}: ${(error as Error).message}`);
        }
      }

      const summaryFileName = `session-${new Date().toISOString().split('T')[0]}.md`;
      const summaryFilePath = `docs/${summaryFileName}`; // Save to .intellicode/docs

      await memoryBankTool.handler({
        action: 'write',
        file_category: 'auto_generated',
        file_name: summaryFilePath,
        content: finalSummaryContent
      });
      logger.info(`Draft summary saved to .intellicode/${summaryFilePath}`);

      // 5. Validation Protocol (Confirmation Request)
      // This part will be handled by the main server logic, which will present the summary to the user
      // and await confirmation before finalizing. For now, we log the prompt.
      logger.info(`\n[SESSION SUMMARY DRAFT]\nI have condensed our conversation. Before I finalize the log, please review this summary.\n\n${finalSummaryContent}\n\n**Is this summary accurate and complete? Please confirm or suggest edits before I commit.**`);

      return { summary: summary };
    }
  };
}

// Placeholder for actual summarization logic (semantic summarization would use an LLM)
function summarizeContent(content: string, retentionRate: number): string {
  if (!content.trim()) {
    return '';
  }

  const lines = content.split('\n');
  const prioritizedLines: string[] = [];
  const otherLines: string[] = [];

  lines.forEach((line: string) => { // Explicitly type 'line' as string
    // Heuristic for critical information (code changes, file paths, conversation turns)
    if (line.match(/^(\+|-)\s*\S+/) || // Diff-like lines
        line.includes('/') || line.includes('\\') || // Potential file paths
        line.includes('User:') || line.includes('Model:') || // Conversation turns
        line.includes('```')) { // Code blocks
      prioritizedLines.push(line);
    } else {
      otherLines.push(line);
    }
  });

  // Retain all prioritized lines
  const summarizedContent = prioritizedLines.join('\n');

  // Summarize other lines based on retention rate
  const sentences = otherLines.join(' ').split(/(?<=[.!?])\s+/);
  const retainedSentenceCount = Math.ceil(sentences.length * retentionRate);
  const summarizedOtherContent = sentences.slice(0, retainedSentenceCount).join(' ') + (sentences.length > retainedSentenceCount ? '...' : '');

  if (summarizedContent && summarizedOtherContent) {
    return `${summarizedContent}\n${summarizedOtherContent}`;
  } else if (summarizedContent) {
    return summarizedContent;
  } else {
    return summarizedOtherContent;
  }
}

async function enhanceSummaryWithLLM(summary: string, config: Config): Promise<string> {
  logger.info('Attempting to enhance summary with LLM...');
  const preferredLlm = config.llm_apis?.preferred_llm;

  let enhancedSummary = summary;

  try {
    switch (preferredLlm) {
      case 'google':
        if (config.llm_apis?.google?.api_key) {
          logger.info('Using Google LLM for enhancement.');
          const genAI = initializeGoogleClient(config);
          if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(`Enhance and refine the following summary, making it more concise and impactful:\n\n${summary}`);
            enhancedSummary = result.response.text();
          }
        } else {
          logger.warn('Google LLM preferred but API key not found.');
        }
        break;
      case 'openai':
        if (config.llm_apis?.openai?.api_key) {
          logger.info('Using OpenAI LLM for enhancement.');
          const openai = initializeOpenAIClient(config);
          if (openai) {
            const chatCompletion = await openai.chat.completions.create({
              messages: [{ role: 'user', content: `Enhance and refine the following summary, making it more concise and impactful:\n\n${summary}` }],
              model: 'gpt-4o',
            });
            enhancedSummary = chatCompletion.choices[0].message.content || summary;
          }
        } else {
          logger.warn('OpenAI LLM preferred but API key not found.');
        }
        break;
      case 'deepseek':
        // DeepSeek API is often compatible with OpenAI API, so we can use the OpenAI client
        if (config.llm_apis?.deepseek?.api_key && config.llm_apis?.deepseek?.base_url) {
          logger.info('Using DeepSeek LLM for enhancement.');
          const deepseek = initializeDeepSeekClient(config);
          if (deepseek) {
            const chatCompletion = await deepseek.chat.completions.create({
              messages: [{ role: 'user', content: `Enhance and refine the following summary, making it more concise and impactful:\n\n${summary}` }],
              model: 'deepseek-chat', // Or whatever DeepSeek model is appropriate
            });
            enhancedSummary = chatCompletion.choices[0].message.content || summary;
          }
        } else {
          logger.warn('DeepSeek LLM preferred but API key or base URL not found.');
        }
        break;
      case 'anthropic':
        if (config.llm_apis?.anthropic?.api_key) {
          logger.info('Using Anthropic LLM for enhancement.');
          const anthropic = initializeAnthropicClient(config);
          if (anthropic) {
            const msg = await anthropic.messages.create({
              model: "claude-3-opus-20240229", // Or whatever Anthropic model is appropriate
              max_tokens: 1024,
              messages: [{ role: "user", content: `Enhance and refine the following summary, making it more concise and impactful:\n\n${summary}` }],
            });
            enhancedSummary = msg.content.map((block: Message['content'][number]) => {
              if (block.type === 'text') {
                return block.text;
              }
              return ''; // Handle other block types if necessary
            }).join('\n');
          }
        } else {
          logger.warn('Anthropic LLM preferred but API key not found.');
        }
        break;
      default:
        logger.warn('No preferred LLM specified or API key not found for preferred LLM. Summary will not be enhanced by an LLM.');
    }
  } catch (error) {
    logger.error(`Error enhancing summary with LLM (${preferredLlm}): ${(error as Error).message}`);
    // Fallback to original summary if LLM enhancement fails
    enhancedSummary = summary;
  }

  return enhancedSummary;
}