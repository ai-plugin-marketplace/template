# AI Plugin Marketplace Template

Author AI assistant plugins once and ship them to multiple host platforms —
**Claude Code, Cursor, Gemini CLI, Kiro, and Vercel Skills CLI** — at the
highest fidelity each one accepts.

This repository is a **thin consumer** of the
[`@ai-plugin-marketplace`](https://www.npmjs.com/package/@ai-plugin-marketplace/cli)
toolkit. It contains your plugin sources and a dependency on the toolkit —
nothing else. All validation, scaffolding, and build logic lives in the
versioned `@ai-plugin-marketplace/*` npm packages, so you upgrade your tooling
with a single `pnpm up` and never get stranded on a forked copy of the build
scripts.

## Getting started

This repo is a GitHub template. Click **"Use this template"** (or run
`aipm init` in an empty directory to generate the same layout from scratch),
then:

```bash
pnpm install
```

> **Note:** `pnpm install` requires the `@ai-plugin-marketplace/*` packages to be
> published to npm. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Authoring plugins

### Add a new plugin

```bash
aipm scaffold my-plugin
```

This creates `plugins/my-plugin/` with an `aipm.config.ts` support envelope and
skeleton manifests for each declared target, and registers the plugin in the
repo-root marketplace registries.

### Build generated artifacts

```bash
aipm build
```

`aipm build` regenerates every toolkit-owned artifact — per-plugin hook JSON
(`hooks/claude.json`, `hooks/hooks.json`) and the standalone bundles under
`dist/gemini/` and `dist/kiro/`. Both authored sources and generated outputs are
committed, so plugins stay browsable on GitHub and pull-request diffs stay
honest.

### Validate

```bash
aipm validate
```

Validation checks the support envelope, every target manifest's schema,
cross-target name consistency, MCP server-key sync, marketplace registration,
and freshness (that the committed generated artifacts match what `aipm build`
would produce).

`package.json` exposes these as `pnpm build`, `pnpm check`, and
`pnpm scaffold` if you prefer the npm-script entry points.

## The support envelope

Each plugin declares the targets it supports in `plugins/<name>/aipm.config.ts`:

```ts
import { defineConfig } from '@ai-plugin-marketplace/core';

export default defineConfig({
  version: '0.1.0',
  targets: ['claude', 'cursor', 'gemini', 'kiro', 'vercel'],
});
```

The toolkit emits artifacts only for declared targets and refuses to validate a
plugin that carries files for a target outside its envelope. To expand a
plugin's envelope, run `aipm add-target <plugin> <target>` to scaffold the
skeleton files for a new target, then fill in the manifest fields.

## Repository structure

```
.
├── .claude-plugin/
│   └── marketplace.json     # Claude Code marketplace registry
├── .cursor-plugin/
│   └── marketplace.json     # Cursor marketplace registry
├── plugins/
│   └── <plugin-name>/       # One directory per plugin (authored sources)
│       ├── aipm.config.ts   # Support envelope + plugin version
│       └── ...              # Manifests, agents, skills, commands, hooks, rules
├── dist/                    # Generated standalone bundles (committed)
│   ├── gemini/
│   └── kiro/
├── package.json             # Depends on @ai-plugin-marketplace/cli + core
├── LICENSE
└── README.md
```

## Upgrading the toolkit

Because the build logic lives in npm packages, upgrading is a routine
dependency bump — no copied scripts to reconcile:

```bash
pnpm up @ai-plugin-marketplace/cli @ai-plugin-marketplace/core
aipm build
git commit -am "chore: upgrade @ai-plugin-marketplace"
```

A minor or patch toolkit upgrade never requires you to change your plugin
manifests. Major upgrades may ask you to run `aipm migrate`; the CLI tells you
when.

## Example plugin: skill-evaluator

The included `skill-evaluator` plugin demonstrates the full multi-platform
pattern end-to-end — it evaluates AI skills across model tiers (opus → sonnet →
haiku) using blind sub-agent testing. See
[plugins/skill-evaluator/README.md](plugins/skill-evaluator/README.md).

## License

MIT — see [LICENSE](LICENSE).
