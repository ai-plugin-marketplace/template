# Contributing

## Prerequisites

This repository consumes the `@ai-plugin-marketplace/*` toolkit from npm. After
cloning, run:

```bash
pnpm install
```

This requires `@ai-plugin-marketplace/cli` and `@ai-plugin-marketplace/core` to
be **published to npm**. A fresh `pnpm install` regenerates `pnpm-lock.yaml`
against the published versions.

## Workflow

1. Add or edit a plugin under `plugins/<name>/`. Use `aipm scaffold <name>` to
   create a new one or `aipm add-target <plugin> <target>` to expand an
   existing plugin's support envelope.
2. Run `aipm build` to regenerate toolkit-owned artifacts (hook JSON and the
   `dist/` bundles). Commit both your authored sources and the regenerated
   output — CI enforces that the tree is clean after a build (freshness).
3. Run `aipm validate` and resolve any hard findings.

## Upgrading the toolkit

```bash
pnpm up @ai-plugin-marketplace/cli @ai-plugin-marketplace/core
aipm build
```

Commit the result. Minor and patch upgrades never require manifest changes;
major upgrades may ask you to run `aipm migrate`.
