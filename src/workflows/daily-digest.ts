import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

type DailyDigestArgs = Record<string, never>;

export function getDailyDigestToolDefinition(_config: Config): { name: string; description: string; schema: object; handler: (args: DailyDigestArgs, context: { call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown> }) => Promise<{ generated: boolean; timestamp: string; message: string }> } {
  return {
    name: 'daily_digest_generator',
    description: 'Generates a daily summary of completed tasks, key decisions, errors, and deadlines.',
    schema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (args: DailyDigestArgs, context: { call: (toolName: string, toolArgs: Record<string, unknown>) => Promise<unknown> }): Promise<{ generated: boolean; timestamp: string; message: string }> => {
      logger.info('Generating daily digest');

      try {
        // Read from memory files
        const progressContent = await context.call('memory_bank_manager', {
          action: 'read',
          file_category: 'dynamic',
          file_name: 'progress.md'
        });

        const handoverContent = await context.call('memory_bank_manager', {
          action: 'read',
          file_category: 'dynamic',
          file_name: 'handover.md'
        });

        const errorLogContent = await context.call('memory_bank_manager', {
          action: 'read',
          file_category: 'technical',
          file_name: 'error-log.md'
        });

        const projectPlanContent = await context.call('memory_bank_manager', {
          action: 'read',
          file_category: 'planning',
          file_name: 'project-plan.md'
        });

        const digestContent = `
# Daily Digest - ${new Date().toLocaleDateString()}

## ✅ Completed Tasks
${(progressContent as { content: string }).content || 'No completed tasks recorded.'}

## 🧠 Key Decisions
${(handoverContent as { content: string }).content || 'No key decisions recorded.'}

## 🛑 Errors
${(errorLogContent as { content: string }).content || 'No errors recorded.'}

## 📅 Deadlines
${(projectPlanContent as { content: string }).content || 'No deadlines recorded.'}
        `;

        // Write the daily digest to auto_generated category
        await context.call('memory_bank_manager', {
          action: 'write',
          file_category: 'auto_generated',
          file_name: `daily-digest-${new Date().toISOString().split('T')[0]}.md`,
          content: digestContent
        });

        return {
          generated: true,
          timestamp: new Date().toISOString(),
          message: 'Daily digest generated successfully.'
        };
      } catch (error) {
        logger.error('Failed to generate daily digest', error);
        throw error;
      }
    }
  };
}