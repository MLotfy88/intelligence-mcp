import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger.js';
import { getMemoryBankToolDefinition } from '../tools/memory-bank.js';
import { Config } from './config-loader.js';

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

export async function initializeMemoryBank(config: Config): Promise<void> {
  const intellicodeDir = '.intellicode';
  const memoryDir = path.join(intellicodeDir, 'memory');

  // Ensure the base .intellicode directory and its subdirectories exist
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'core'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'dynamic'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'planning'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'technical'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'auto_generated'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'archive', 'core'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'archive', 'dynamic'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'archive', 'technical'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'memory', 'drafts'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'docs'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'conflict-resolution'), { recursive: true });
  await fs.mkdir(path.join(intellicodeDir, 'archive'), { recursive: true }); // Top-level archive for .intellicode

  logger.info('Memory bank directories ensured to exist. Initializing missing default files...');

  for (const filePath in defaultMemoryFileContents) {
    const fullPath = path.join(intellicodeDir, 'memory', filePath);
    const content = defaultMemoryFileContents[filePath as keyof typeof defaultMemoryFileContents];

    try {
      await fs.access(fullPath);
      logger.info(`Memory file already exists: ${fullPath}. Skipping creation.`);
    } catch (error) {
      // File does not exist, create it with default content
      await fs.writeFile(fullPath, content, 'utf-8');
      logger.info(`Created initial memory file: ${fullPath}`);
    }
  }
  logger.info('Memory bank initialization complete.');
}