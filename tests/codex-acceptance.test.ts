/**
 * Tests for scripts/codex-acceptance.ts — target resolution.
 *
 * The acceptance driver derives the marketplace + plugin from the marketplace
 * manifest rather than hardcoding the example plugin. These tests exercise that
 * resolution (including the "fresh start" empty case) and the manifest loader.
 *
 * @see https://developers.openai.com/codex/plugins/build — Codex plugin schema
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadMarketplace,
  parsePluginArg,
  resolvePluginSelection,
  type CodexMarketplace,
} from "../scripts/codex-acceptance.js";

const ROOT = "/repo";

/** Build a minimal valid marketplace manifest for resolution tests. */
function makeMarketplace(
  name: string,
  plugins: Array<{ name: string; path?: string }>,
): CodexMarketplace {
  return {
    name,
    plugins: plugins.map((p) => ({
      name: p.name,
      source: { source: "local", path: p.path ?? `./plugins/${p.name}` },
    })),
  };
}

describe("resolvePluginSelection", () => {
  describe("single plugin", () => {
    const single = makeMarketplace("mkt", [{ name: "alpha" }]);

    it("auto-selects the lone plugin when no --plugin is given", () => {
      const r = resolvePluginSelection(single, {
        pluginArg: undefined,
        root: ROOT,
      });
      expect(r).toEqual({
        kind: "ok",
        target: {
          marketplaceName: "mkt",
          pluginName: "alpha",
          pluginDir: path.join(ROOT, "./plugins/alpha"),
        },
      });
    });

    it("selects it when --plugin matches", () => {
      const r = resolvePluginSelection(single, {
        pluginArg: "alpha",
        root: ROOT,
      });
      expect(r.kind).toBe("ok");
    });

    it("reports not-found when --plugin does not match", () => {
      const r = resolvePluginSelection(single, {
        pluginArg: "ghost",
        root: ROOT,
      });
      expect(r).toEqual({
        kind: "not-found",
        requested: "ghost",
        available: ["alpha"],
      });
    });
  });

  describe("multiple plugins", () => {
    const multi = makeMarketplace("mkt", [{ name: "alpha" }, { name: "beta" }]);

    it("is ambiguous without --plugin", () => {
      const r = resolvePluginSelection(multi, {
        pluginArg: undefined,
        root: ROOT,
      });
      expect(r).toEqual({ kind: "ambiguous", available: ["alpha", "beta"] });
    });

    it("selects the named plugin with --plugin", () => {
      const r = resolvePluginSelection(multi, {
        pluginArg: "beta",
        root: ROOT,
      });
      expect(r).toEqual({
        kind: "ok",
        target: {
          marketplaceName: "mkt",
          pluginName: "beta",
          pluginDir: path.join(ROOT, "./plugins/beta"),
        },
      });
    });

    it("reports not-found for an unknown --plugin", () => {
      const r = resolvePluginSelection(multi, {
        pluginArg: "ghost",
        root: ROOT,
      });
      expect(r).toEqual({
        kind: "not-found",
        requested: "ghost",
        available: ["alpha", "beta"],
      });
    });
  });

  describe("no plugins (fresh start)", () => {
    const empty = makeMarketplace("mkt", []);

    it("is empty without --plugin so preflight can no-op", () => {
      const r = resolvePluginSelection(empty, {
        pluginArg: undefined,
        root: ROOT,
      });
      expect(r).toEqual({ kind: "empty" });
    });

    it("reports not-found (empty list) when --plugin is given", () => {
      const r = resolvePluginSelection(empty, {
        pluginArg: "alpha",
        root: ROOT,
      });
      expect(r).toEqual({
        kind: "not-found",
        requested: "alpha",
        available: [],
      });
    });
  });

  it("derives pluginDir from the entry's source.path, not a name guess", () => {
    const custom = makeMarketplace("mkt", [
      { name: "alpha", path: "./packages/custom-dir" },
    ]);
    const r = resolvePluginSelection(custom, {
      pluginArg: undefined,
      root: ROOT,
    });
    expect(r).toMatchObject({
      target: { pluginDir: path.join(ROOT, "./packages/custom-dir") },
    });
  });
});

describe("parsePluginArg", () => {
  it("reads `--plugin <name>`", () => {
    expect(parsePluginArg(["--plugin", "foo"])).toBe("foo");
  });

  it("reads `--plugin=<name>`", () => {
    expect(parsePluginArg(["--plugin=foo"])).toBe("foo");
  });

  it("returns undefined when absent", () => {
    expect(parsePluginArg(["verify", "--other"])).toBeUndefined();
  });

  it("returns undefined when `--plugin` has no value", () => {
    expect(parsePluginArg(["--plugin"])).toBeUndefined();
  });
});

describe("loadMarketplace", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir !== undefined) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = undefined;
    }
  });

  function writeTmp(contents: string): string {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-accept-test-"));
    const file = path.join(tmpDir, "marketplace.json");
    fs.writeFileSync(file, contents);
    return file;
  }

  it("reports missing for a nonexistent file", () => {
    const r = loadMarketplace(path.join(os.tmpdir(), "does-not-exist-xyz.json"));
    expect(r).toEqual({ kind: "missing" });
  });

  it("reports invalid for malformed JSON", () => {
    const r = loadMarketplace(writeTmp("{ not json"));
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") expect(r.issues).toMatch(/not valid JSON/);
  });

  it("reports invalid for a schema violation", () => {
    // Missing required `name` and `plugins`.
    const r = loadMarketplace(writeTmp(JSON.stringify({ owner: { name: "x" } })));
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") expect(r.issues.length).toBeGreaterThan(0);
  });

  it("returns parsed data for a valid manifest", () => {
    const r = loadMarketplace(
      writeTmp(JSON.stringify(makeMarketplace("mkt", [{ name: "alpha" }]))),
    );
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.data.name).toBe("mkt");
      expect(r.data.plugins.map((p) => p.name)).toEqual(["alpha"]);
    }
  });
});
