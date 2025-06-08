import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

type DailyDigestArgs = Record<string, never>;

export function getDailyDigestToolDefinition(_config: Config): { name: string; description: string; schema: object; handler: (args: DailyDigestArgs, context: { call: (toolName: string, toolArgs: Record<string, any>) => Promise<any> }) => Promise<{ generated: boolean; timestamp: string; message: string }> } { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
  return {
    name: 'daily_digest_generator',
    description: 'Generates a daily summary of completed tasks, key decisions, errors, and deadlines.',
    schema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (args: DailyDigestArgs, context: { call: (toolName: string, toolArgs: Record<string, any>) => Promise<any> }): Promise<{ generated: boolean; timestamp: string; message: string }> => { // The 'any' type is used for 'toolArgs' and the Promise return type because MCP tool calls can have diverse and dynamic argument/return types, making a strict union type overly complex and difficult to maintain.
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
${progressContent.content || 'No completed tasks recorded.'}

## 🧠 Key Decisions
${handoverContent.content || 'No key decisions recorded.'}

## 🛑 Errors
${errorLogContent.content || 'No errors recorded.'}

## 📅 Deadlines
${projectPlanContent.content || 'No deadlines recorded.'}
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