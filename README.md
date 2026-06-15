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

The `@ai-plugin-marketplace/*` packages are published to npm, so a fresh
`pnpm install` resolves them directly. See [CONTRIBUTING.md](CONTRIBUTING.md).

> [!IMPORTANT]
> **Rename your marketplace first.** Open `aipm.workspace.ts` and change
> `marketplace.name` (and `owner`) from the placeholder `my-ai-plugins` to a
> **unique** name — convention `"<your-handle>-ai-plugins"`, e.g. `mnorth-ai-plugins`.
> The `name` is what hosts register your marketplace under; if it collides with another
> marketplace (such as the upstream `ai-plugin-marketplace`), the second one installed
> shadows or strands the first's plugins. `aipm validate` warns while the name is still a
> default. (Scaffolding from scratch with `aipm init --name <name>` sets this for you.)

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

`aipm build` regenerates every toolkit-owned artifact:

- per-plugin hook JSON (`hooks/claude.json`, `hooks/hooks.json`);
- the standalone bundles under `dist/gemini/` and `dist/kiro/`;
- the marketplace registries (`.claude-plugin/marketplace.json`,
  `.cursor-plugin/marketplace.json`) — generated from `aipm.workspace.ts` plus
  each plugin's `aipm.config.ts` (see [Marketplace metadata](#marketplace-metadata-and-generated-registries));
- for a single-plugin marketplace, the **repo-root Gemini extension and Kiro
  power** (`gemini-extension.json`, `GEMINI.md`, `POWER.md`, `commands/`,
  `skills/`, `steering/`, `.kiro/`, …) so the repo installs natively into hosts
  that have no marketplace concept.

Both authored sources and generated outputs are committed, so plugins stay
browsable on GitHub and pull-request diffs stay honest.

### Validate

```bash
aipm validate
```

Validation checks the support envelope, every target manifest's schema,
cross-target name consistency, MCP server-key sync, marketplace registration,
and freshness — that the committed generated artifacts (registries, bundles,
and the repo-root Gemini/Kiro emission) match what `aipm build` would produce.

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

## Marketplace metadata and generated registries

Repo-level marketplace metadata lives in `aipm.workspace.ts` at the repo root:

```ts
import { defineWorkspace } from '@ai-plugin-marketplace/core';

export default defineWorkspace({
  marketplace: {
    name: 'ai-plugin-marketplace',
    owner: { name: 'AI Plugin Marketplace Template' },
    description: 'Universal AI Plugin Marketplace — author once, distribute to all platforms',
  },
});
```

The **presence of this file opts the repo into generated registries.** Instead
of hand-maintaining `.claude-plugin/marketplace.json` and
`.cursor-plugin/marketplace.json`, `aipm build` generates them from the
workspace metadata plus each plugin's `aipm.config.ts` (its `description` and
`keywords` become the registry entry's `description` and `tags`). The generated
registries are committed and freshness-checked like every other artifact.

### Gemini and Kiro: the single-plugin marketplace

Gemini CLI and Kiro have **no marketplace concept** — a repo is installed as one
extension (Gemini) or one power (Kiro) from its root. So when a marketplace
exposes **exactly one plugin**, `aipm build` additionally emits that plugin's
Gemini/Kiro artifacts at the **repo root** (`gemini-extension.json`, `GEMINI.md`,
`POWER.md`, `commands/`, `skills/`, `steering/`, `.kiro/`), letting the repo
install natively into those hosts. A sidecar at `.aipm/generated-root.json`
records exactly which root paths the toolkit owns.

If you add a **second plugin**, the repo can no longer be a single Gemini/Kiro
artifact: `aipm validate` reports a `single-artifact-host` finding, and you keep
full Claude/Cursor marketplace support (which can host many plugins) while
choosing one plugin to expose to Gemini/Kiro. Because the repo root is the
single Gemini/Kiro artifact, the plugin does **not** carry its own `LICENSE` or
`README.md` — the repo-root `LICENSE`/`README.md` are canonical and are never
overwritten by generation.

## Repository structure

```
.
├── aipm.workspace.ts        # Marketplace metadata (opts into generated registries)
├── .claude-plugin/
│   └── marketplace.json     # Claude Code registry (GENERATED)
├── .cursor-plugin/
│   └── marketplace.json     # Cursor registry (GENERATED)
├── plugins/
│   └── <plugin-name>/       # One directory per plugin (authored sources)
│       ├── aipm.config.ts   # Support envelope + version + description/keywords
│       └── ...              # Manifests, agents, skills, commands, hooks, rules
├── dist/                    # Generated standalone bundles (committed)
│   ├── gemini/
│   └── kiro/
│
│   # Repo-root Gemini/Kiro artifacts — emitted for a single-plugin marketplace
│   # (GENERATED; tracked in .aipm/generated-root.json):
├── gemini-extension.json
├── GEMINI.md
├── POWER.md
├── commands/  skills/  steering/  agents/  hooks/  mcp.json  .kiro/
├── .aipm/
│   └── generated-root.json  # Records which repo-root paths the toolkit owns
│
├── package.json             # Depends on @ai-plugin-marketplace/cli + core
├── LICENSE                  # Canonical — also serves the Gemini/Kiro artifact
└── README.md                # Canonical — also serves the Gemini/Kiro artifact
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
pattern end-to-end. Given a skill (`SKILL.md`) and a set of test cases, it:

1. runs the skill with blind test-subject agents at different model tiers
   (opus → sonnet → haiku);
2. compares outputs against expected outcomes;
3. identifies where skill clarity degrades at lower tiers;
4. generates actionable refinement recommendations.

Invoke it in any host with `/evaluate path/to/SKILL.md path/to/test-cases.json`,
where each test case is `{ "input": "...", "expectedOutcome": "..." }`. The skill
definition lives at
[plugins/skill-evaluator/skills/evaluate-skill/SKILL.md](plugins/skill-evaluator/skills/evaluate-skill/SKILL.md).

## License

MIT — see [LICENSE](LICENSE).
