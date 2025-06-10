import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger.js';
import { getMemoryBankToolDefinition } from '../tools/memory-bank.js';
import { Config } from './config-loader.js';
import { FileCategory } from '../types/memory-bank.d.js';

const defaultMemoryFileContents = {
  'core/project-brief.md': `# Project Brief

This document provides a high-level overview of your project. It defines core requirements and goals, serving as the source of truth for your project's scope.
`,
  'core/productContext.md': `# Product Context

This document explains why this project exists, the problems it solves, how it should work, and its user experience goals.
`,
  'core/activeContext.md': `# Active Context

This document tracks your current work focus, recent changes, next steps, and active decisions and considerations.
`,
  'core/system-patterns.md': `# System Patterns and Design Principles

This document outlines the system architecture, key technical decisions, design patterns in use, and component relationships for your project.
`,
  'core/techContext.md': `# Technical Context

This document details the technologies used, development setup, technical constraints, and dependencies for your project.
`,
  'dynamic/progress.md': `# Progress Log

This document tracks what works, what's left to build, current status, and known issues for your project.
`,
  'planning/project-plan.md': `# Project Plan

This document outlines the objectives, timeline, and key milestones for your project.
`,
  'planning/roadmap.md': `# Roadmap

This document outlines the future milestones and long-term vision for your project.
`,
  'technical/error-log.md': `# Error Log

This document records errors encountered during development and their resolutions.
`,
  'technical/dependency-map.md': `# Dependency Map

This document provides a visual representation of dependencies between files or components in your project.
`,
  'technical/api-contracts.md': `# API Contracts and Design Principles

This document outlines the core API contracts and design principles for your project.
`
};

export async function initializeMemoryBank(_config: Config): Promise<void> {
  const intellicodeDir = '.intellicode';
  const memoryBankTool = getMemoryBankToolDefinition(_config);

  // Ensure top-level .intellicode directories exist (not managed by memory_bank_manager categories)
  await fs.mkdir(path.join(intellicodeDir, 'docs'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'conflict-resolution'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'archive'), { recursive: true }); // Top-level archive for .intellicode

  logger.info('Initializing missing default memory files...');

  for (const filePath in defaultMemoryFileContents) {
    const content = defaultMemoryFileContents[filePath as keyof typeof defaultMemoryFileContents];
    const [category, fileName] = filePath.split('/');

    try {
      // Attempt to read the file using the memory_bank_manager tool
      await memoryBankTool.handler({ action: 'read', file_category: category as FileCategory, file_name: fileName });
      logger.info(`Memory file already exists: .intellicode/memory/${filePath}. Skipping creation.`);
    } catch (error) {
      // If read fails (file doesn't exist), then write it using the memory_bank_manager tool
      await memoryBankTool.handler({
        action: 'write',
        file_category: category as FileCategory,
        file_name: fileName,
        content: content
      });
      logger.info(`Created initial memory file: .intellicode/memory/${filePath}`);
    }
  }
  logger.info('Memory bank initialization complete.');
}