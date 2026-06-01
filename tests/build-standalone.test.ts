/**
 * Tests for src/build-standalone.ts.
 *
 * Regression focus: `dist/` must be a pure function of `plugins/`. Removing or
 * renaming a plugin must not leave stale exports behind — the builder cleans
 * the target roots it owns on every run, so no manual `rm` is ever required.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildAll, TARGETS } from "../src/build-standalone.js";

let tmpRoot: string | undefined;

beforeEach(() => {
  // Silence the builder's progress logging during tests.
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  if (tmpRoot !== undefined) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    tmpRoot = undefined;
  }
});

function makeRoot(): string {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "build-standalone-test-"));
  return tmpRoot;
}

function write(root: string, rel: string, contents: string): void {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

/** A plugin with the minimum needed to produce output in both targets. */
function writePlugin(root: string, name: string): void {
  write(root, `plugins/${name}/GEMINI.md`, `# ${name} (gemini)\n`);
  write(root, `plugins/${name}/POWER.md`, `# ${name} (kiro)\n`);
}

describe("buildAll — stale artifact cleanup", () => {
  it("removes dist output for a plugin that no longer exists in plugins/", () => {
    const root = makeRoot();
    writePlugin(root, "current");

    // Stale exports from a previously-built, now-removed plugin.
    write(root, "dist/gemini/removed/GEMINI.md", "stale\n");
    write(root, "dist/kiro/removed/POWER.md", "stale\n");

    buildAll(root);

    // Stale plugin dirs are gone from every target.
    expect(fs.existsSync(path.join(root, "dist/gemini/removed"))).toBe(false);
    expect(fs.existsSync(path.join(root, "dist/kiro/removed"))).toBe(false);

    // The current plugin is freshly built in every target.
    expect(fs.existsSync(path.join(root, "dist/gemini/current/GEMINI.md"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(root, "dist/kiro/current/POWER.md"))).toBe(
      true,
    );
  });

  it("clears all target roots when plugins/ is empty (fresh start)", () => {
    const root = makeRoot();
    fs.mkdirSync(path.join(root, "plugins"), { recursive: true });
    write(root, "dist/gemini/removed/GEMINI.md", "stale\n");
    write(root, "dist/kiro/removed/POWER.md", "stale\n");

    buildAll(root);

    for (const target of TARGETS) {
      expect(fs.existsSync(path.join(root, "dist", target))).toBe(false);
    }
  });

  it("does not leave content from a renamed plugin under its old name", () => {
    const root = makeRoot();
    // First build under the old name.
    writePlugin(root, "old-name");
    buildAll(root);
    expect(fs.existsSync(path.join(root, "dist/gemini/old-name"))).toBe(true);

    // Rename: remove old, add new, rebuild.
    fs.rmSync(path.join(root, "plugins/old-name"), { recursive: true });
    writePlugin(root, "new-name");
    buildAll(root);

    expect(fs.existsSync(path.join(root, "dist/gemini/old-name"))).toBe(false);
    expect(fs.existsSync(path.join(root, "dist/gemini/new-name/GEMINI.md"))).toBe(
      true,
    );
  });

  it("exits when plugins/ is missing entirely", () => {
    const root = makeRoot();
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);

    expect(() => buildAll(path.join(root, "no-such-subdir"))).toThrow(
      "process.exit called",
    );
    expect(exit).toHaveBeenCalledWith(1);
  });
});
