import { defineWorkspace } from '@ai-plugin-marketplace/core';

/**
 * Marketplace metadata for this repo. Its presence opts the repo into generated marketplace
 * registries (`.claude-plugin/`, `.cursor-plugin/`, and — when Codex is targeted —
 * `.agents/plugins/`) instead of hand-authored JSON. Because this marketplace exposes a single
 * plugin, the toolkit also emits the repo-root Gemini extension and Kiro power for it.
 */
export default defineWorkspace({
  marketplace: {
    name: 'ai-plugin-marketplace',
    owner: { name: 'AI Plugin Marketplace Template' },
    description: 'Universal AI Plugin Marketplace — author once, distribute to all platforms',
  },
});
