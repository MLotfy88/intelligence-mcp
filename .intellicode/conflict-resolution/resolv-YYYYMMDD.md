# Conflict Resolution Log

This directory (`.intellicode/conflict-resolution`) is dedicated to logging and managing conflicts detected by the IntelliCodeMCP system. Each conflict will be documented in a separate Markdown file, named `resolv-YYYYMMDD.md`, where `YYYYMMDD` represents the date the conflict was detected.

## Purpose

The purpose of this log is to:
*   **Document Conflicts:** Provide a clear record of all detected conflicts, including their type, message, and priority.
*   **Facilitate Manual Intervention:** Serve as a reference for users to understand and manually resolve critical conflicts (P0 priority) that cannot be auto-resolved.
*   **Improve System Reliability:** Help in identifying recurring conflict patterns and improving the system's proactive conflict detection and resolution capabilities over time.

## Conflict Details Structure

Each `resolv-YYYYMMDD.md` file will contain the following information for each conflict:

### Conflict Details: [Timestamp]

*   **Type:** `schema_break` | `plan_violation` | `unsafe_type`
    *   `schema_break`: Indicates a proposed change violates a defined API contract or data schema (e.g., `api-contracts.md`).
    *   `plan_violation`: Indicates a proposed change goes against established project plans or system design patterns (e.g., `project-plan.md`, `system-patterns.md`).
    *   `unsafe_type`: Indicates the introduction of potentially unsafe type usage (e.g., excessive use of `any` in TypeScript without justification).
*   **Priority:** `P0` (Critical) | `P1` (Warning)
    *   `P0`: Critical conflicts that halt execution and require immediate manual intervention.
    *   `P1`: Warning-level conflicts that may be auto-resolved by the system (if auto-resolution is enabled and configured) or require user review.
*   **Message:** A detailed description of the conflict, including the command or code snippet that triggered it, and the specific rule or contract that was violated.
*   **Affected File(s):** The path(s) to the file(s) where the conflict was detected.
*   **Proposed Action (if applicable):** A suggestion for how to resolve the conflict.

## Example Entry

```markdown
### Conflict Details: 2025-06-10 14:30:00 UTC

*   **Type:** `schema_break`
*   **Priority:** `P0`
*   **Message:** Proposed change introduces a new API endpoint `/users/new` that is not defined in `api-contracts.md`. This could lead to inconsistencies in the API surface.
*   **Affected File(s):** `src/api/user-routes.ts`
*   **Proposed Action:** Update `api-contracts.md` to include the definition for `/users/new` or revise `src/api/user-routes.ts` to adhere to existing contracts.
```

## Resolution Workflow

1.  **Detection:** IntelliCodeMCP detects a conflict during the `code_intelligence_analyze` tool's `fullAnalysisPipeline`.
2.  **Logging:** A new entry is created in `resolv-YYYYMMDD.md` with the conflict details.
3.  **Notification:** The user is notified of the detected conflict.
4.  **Intervention:**
    *   For `P0` conflicts, the system halts execution, requiring the user to manually review the `resolv-YYYYMMDD.md` file and apply necessary fixes.
    *   For `P1` conflicts, the system may attempt an auto-resolution (if configured) or prompt the user for review.
5.  **Verification:** After manual resolution, the user should re-run the analysis to ensure the conflict is resolved.

By maintaining this log, IntelliCodeMCP aims to provide a transparent and manageable approach to conflict resolution, ensuring the integrity and consistency of your codebase.