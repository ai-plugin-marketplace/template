import { defineConfig } from '@ai-plugin-marketplace/core';

export default defineConfig({
  version: '0.1.0',
  targets: ['claude', 'cursor', 'gemini', 'kiro', 'vercel'],
  description:
    'Evaluate AI skills across model tiers with blind testing and refinement recommendations',
  keywords: ['evaluation', 'testing', 'skills', 'model-tiers'],
});
