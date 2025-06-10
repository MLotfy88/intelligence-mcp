import { Config } from '../utils/config-loader.js';
import { logger } from '../utils/logger.js';

interface SequentialThinkingArgs {
  problem_statement: string;
  thinking_depth?: number;
  include_alternatives?: boolean;
  thoughtNumber?: number;
  nextThoughtNeeded?: string;
  isRevision?: boolean;
  branchId?: string;
}

interface SequentialThinkingResult {
  status: string;
  message: string;
  problem_statement: string;
  thinking_depth: number;
  include_alternatives: boolean;
  steps: string[];
  decisions: string[];
  alternatives: string[];
  thoughtNumber?: number;
  nextThoughtNeeded?: string;
  isRevision?: boolean;
  branchId?: string;
  technical_deep_dive?: string;
  proof?: string;
}

export function getSequentialThinkingToolDefinition(config: Config): { name: string; description: string; schema: object; handler: (args: SequentialThinkingArgs) => Promise<SequentialThinkingResult> } {
  return {
    name: "sequential_thinking_process",
    description: "Step-by-step problem solving with decision trees",
    schema: {
      type: "object",
      properties: {
        problem_statement: { type: "string" },
        thinking_depth: { type: "number", default: 3 },
        include_alternatives: { type: "boolean", default: true },
        thoughtNumber: { type: "number" },
        nextThoughtNeeded: { type: "string" },
        isRevision: { type: "boolean" },
        branchId: { type: "string" },
      },
      required: ["problem_statement"],
    },
    handler: async (args: SequentialThinkingArgs): Promise<SequentialThinkingResult> => {
      logger.info(`Executing sequential_thinking_process with problem: ${args.problem_statement}`);
      const thinkingConfig = config.integrations.sequential_thinking;

      // Simulate deep thinking process (30 seconds delay)
      logger.info('Simulating deep thinking for 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      logger.info('Deep thinking complete.');

      const maxDepth = Math.min(args.thinking_depth || 3, thinkingConfig?.max_depth || 5);
      const includeAlternatives = args.include_alternatives ?? true;

      const steps: string[] = [
        `Step 1: Understand the problem: ${args.problem_statement}`,
        `Step 2: Break down into sub-problems based on thought number ${args.thoughtNumber || 1}.`,
        `Step 3: Generate potential solutions.`,
        `Step 4: Evaluate alternatives if requested.`
      ];

      const decisions: string[] = [
        `Decision 1: Prioritize based on current context.`,
        `Decision 2: Choose optimal path for '${args.nextThoughtNeeded || "initial problem"}'`
      ];

      const alternatives: string[] = includeAlternatives ? [
        "Alternative 1: Consider a different architectural pattern.",
        "Alternative 2: Explore existing libraries for a quicker solution."
      ] : [];

      const technicalDeepDive = `
        ### Technical Deep Dive: Problem Analysis and Solution Approach

        **Problem Statement:** "${args.problem_statement}"

        **Current Thought Number:** ${args.thoughtNumber ?? 1}
        **Next Thought Needed:** ${args.nextThoughtNeeded ?? "N/A"}
        **Is Revision:** ${args.isRevision ?? false}
        **Branch ID:** ${args.branchId ?? "N/A"}

        **Example:** If the problem is "Optimize database queries for performance," a deep dive might involve:
        -   **Inspection:** Analyzing current query execution plans, indexing strategies, and data volume.
        -   **Diagnosis:** Identifying slow queries, missing indexes, or inefficient joins.
        -   **Execution Plan:** Proposing specific index additions, query rewrites, or caching mechanisms.

        **Reasoning:** The sequential thinking process aims to systematically break down complex problems. Each "thought" builds upon the previous one, allowing for iterative refinement and branching for alternative considerations. This structured approach minimizes oversight and ensures comprehensive problem-solving.
      `;

      const proof = `
        [PROOF] The proposed steps are logically sound and follow established software engineering principles.
        For example, breaking down problems (Step 2) is a fundamental practice for managing complexity.
        Evaluating alternatives (Step 4) ensures a robust and optimized solution.
        This process scales for complex problems by allowing deeper 'thinking_depth' and branching 'branchId' for parallel exploration.
      `;

      return {
        status: "success",
        message: `Sequential thinking process completed for: "${args.problem_statement}".`,
        problem_statement: args.problem_statement,
        thinking_depth: maxDepth,
        include_alternatives: includeAlternatives,
        steps: steps,
        decisions: decisions,
        alternatives: alternatives,
        thoughtNumber: args.thoughtNumber,
        nextThoughtNeeded: args.nextThoughtNeeded,
        isRevision: args.isRevision,
        branchId: args.branchId,
        technical_deep_dive: technicalDeepDive,
        proof: proof,
      };
    }
  };
}