import { describe, expect, it, vi } from "vitest";
import type { ShellEnv, ShellResult } from "../shell";
import { completeInput, resolvePath, runShell } from "../shell";

const home = { cwd: "~", log: [] };
const text = (r: ShellResult) => r.output.map((l) => l.text).join("\n");

function mockEnv(): ShellEnv {
  return {
    runCommand: vi.fn(),
    scrollTo: vi.fn(),
    openUrl: vi.fn(),
    showCv: vi.fn(),
    openPalette: vi.fn(),
    closeShell: vi.fn(),
  };
}

describe("resolvePath", () => {
  it("resolves relative, parent and home paths", () => {
    expect(resolvePath("~", "projects")).toBe("~/projects");
    expect(resolvePath("~/projects", "..")).toBe("~");
    expect(resolvePath("~/projects", "~/about.txt")).toBe("~/about.txt");
    expect(resolvePath("~/projects", "./quickgigs.md")).toBe("~/projects/quickgigs.md");
  });

  it("never climbs above home", () => {
    expect(resolvePath("~", "../../..")).toBe("~");
  });
});

describe("runShell", () => {
  it("lists the home directory without hidden files", () => {
    const out = text(runShell("ls", home));
    expect(out).toContain("projects/");
    expect(out).toContain("about.txt");
    expect(out).not.toContain(".rabbit");
    expect(text(runShell("ls -a", home))).toContain(".rabbit");
  });

  it("changes directory and rejects bad targets", () => {
    expect(runShell("cd projects", home).cwd).toBe("~/projects");
    expect(runShell("cd", { cwd: "~/projects", log: [] }).cwd).toBe("~");
    expect(text(runShell("cd nowhere", home))).toContain("no such file");
    expect(text(runShell("cd about.txt", home))).toContain("not a directory");
  });

  it("reads project files relative to the working directory", () => {
    expect(text(runShell("cat projects/quickgigs.md", home))).toContain("QUICKGIGS");
    expect(text(runShell("cat quickgigs.md", { cwd: "~/projects", log: [] }))).toContain("QUICKGIGS");
    expect(text(runShell("cat projects", home))).toContain("is a directory");
    expect(text(runShell("cat nope.txt", home))).toContain("no such file");
  });

  it("opens a project's live site", () => {
    const env = mockEnv();
    runShell("open quickgigs", home).effect?.(env);
    expect(env.openUrl).toHaveBeenCalledWith("https://quickgigs-tblp.onrender.com");
  });

  it("opens a project by file path and falls back to its repo", () => {
    const env = mockEnv();
    runShell("open projects/construct.md", home).effect?.(env);
    expect(env.openUrl).toHaveBeenCalledWith("https://github.com/aransys/matrix-portfolio");
  });

  it("routes themes and easter-egg phrases to palette commands", () => {
    const env = mockEnv();
    runShell("theme blue", home).effect?.(env);
    expect(env.runCommand).toHaveBeenCalledWith("theme.reloaded");
    runShell("rabbit", home).effect?.(env);
    expect(env.runCommand).toHaveBeenCalledWith("egg.rabbit");
  });

  it("jumps to sections and shows the CV", () => {
    const env = mockEnv();
    runShell("missions", home).effect?.(env);
    expect(env.scrollTo).toHaveBeenCalledWith("projects");
    runShell("redpill", home).effect?.(env);
    expect(env.showCv).toHaveBeenCalled();
  });

  it("grants sudo only for hiring", () => {
    const env = mockEnv();
    const hire = runShell("sudo hire", home);
    expect(text(hire)).toContain("access granted");
    hire.effect?.(env);
    expect(env.scrollTo).toHaveBeenCalledWith("contact");
    expect(text(runShell("sudo rm -rf /", home))).toContain("not in the sudoers file");
  });

  it("suggests a near miss for unknown commands", () => {
    expect(text(runShell("hlep", home))).toContain("did you mean 'help'");
    expect(text(runShell("xyzzy123", home))).toContain("type 'help'");
  });

  it("prints nothing for empty input and flags clear", () => {
    expect(runShell("   ", home).output).toEqual([]);
    expect(runShell("clear", home).clear).toBe(true);
  });
});

describe("completeInput", () => {
  it("completes a unique command and adds a space", () => {
    expect(completeInput("the", "~")).toEqual({ value: "theme ", options: [] });
  });

  it("offers every match when the prefix is ambiguous", () => {
    const c = completeInput("c", "~");
    expect(c.value).toBe("c");
    expect(c.options).toEqual(expect.arrayContaining(["cat", "cd", "cv", "clear", "contact"]));
  });

  it("completes paths through directories", () => {
    expect(completeInput("cat pr", "~").value).toBe("cat projects/");
    expect(completeInput("cat projects/q", "~").value).toBe("cat projects/quickgigs.md ");
    expect(completeInput("cat q", "~/projects").value).toBe("cat quickgigs.md ");
  });

  it("only offers directories to cd", () => {
    expect(completeInput("cd ", "~")).toEqual({ value: "cd projects/", options: [] });
  });

  it("completes command-specific arguments", () => {
    expect(completeInput("theme rel", "~").value).toBe("theme reloaded ");
    expect(completeInput("sudo ", "~").value).toBe("sudo hire ");
    expect(completeInput("open quick", "~").value).toBe("open quickgigs ");
  });

  it("leaves the input alone when nothing matches", () => {
    expect(completeInput("zzz", "~")).toEqual({ value: "zzz", options: [] });
  });
});
