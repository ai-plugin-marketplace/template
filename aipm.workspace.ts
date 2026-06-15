import { defineWorkspace } from '@ai-plugin-marketplace/core';

/**
 * Marketplace metadata for this repo. Its presence opts the repo into generated marketplace
 * registries (`.claude-plugin/`, `.cursor-plugin/`, and — when Codex is targeted —
 * `.agents/plugins/`) instead of hand-authored JSON. Because this marketplace exposes a single
 * plugin, the toolkit also emits the repo-root Gemini extension and Kiro power for it.
 */
export default defineWorkspace({
  marketplace: {
    // ⚠️ RENAME THIS before you publish. The marketplace `name` is the identifier hosts register
    // your marketplace under, so it must be UNIQUE — if two repos share a name, the second one
    // installed shadows/strands the first's plugins. Do NOT leave the placeholder. Convention:
    // "<your-handle>-ai-plugins" (e.g. "mnorth-ai-plugins"). `aipm validate` warns while this is
    // still a default.
    name: 'my-ai-plugins',
    owner: { name: 'Your Name' },
    description: 'Universal AI Plugin Marketplace — author once, distribute to all platforms',
  },
});
