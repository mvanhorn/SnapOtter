import fs from "node:fs";
import nodeModule from "node:module";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REAL_TMPDIR = os.tmpdir();
const REAL_PROCESS_ON = process.on.bind(process);
const REAL_CREATE_REQUIRE = nodeModule.createRequire;
const pgClient = vi.hoisted(() => ({
  connect: vi.fn(async () => {}),
  query: vi.fn(async () => ({ rows: [{ ok: 1 }] })),
  end: vi.fn(async () => {}),
}));
const containerStops = vi.hoisted(() => ({
  redis: vi.fn(async () => {}),
  postgres: vi.fn(async () => {}),
}));

vi.mock("pg", () => {
  class Client {
    connect = pgClient.connect;
    query = pgClient.query;
    end = pgClient.end;
  }
  return { default: { Client }, Client };
});
vi.mock("@testcontainers/postgresql", () => ({
  PostgreSqlContainer: class {
    start() {
      return Promise.resolve({
        getConnectionUri: () => "postgres://user:pass@127.0.0.1:5432/postgres",
        stop: containerStops.postgres,
      });
    }
  },
}));
vi.mock("@testcontainers/redis", () => ({
  RedisContainer: class {
    start() {
      return Promise.resolve({
        getConnectionUrl: () => "redis://127.0.0.1:6379",
        stop: containerStops.redis,
      });
    }
  },
}));

let fixtureRoot: string;
let envSnapshot: NodeJS.ProcessEnv;

beforeEach(() => {
  envSnapshot = { ...process.env };
  process.env.TEST_PG_BASE_URL ??= "postgres://user:pass@127.0.0.1:5432/postgres";
  process.env.TEST_RUNTIME_ROLE ??= "snapotter_app_test";
  process.env.TEST_RUNTIME_PASSWORD ??= "snapotter_app_test_pw";
  process.env.TEST_REDIS_BASE_URL ??= "redis://127.0.0.1:6379";
  fixtureRoot = fs.mkdtempSync(path.join(REAL_TMPDIR, "ws-cleanup-"));
  pgClient.connect.mockReset().mockResolvedValue(undefined);
  pgClient.query.mockReset().mockResolvedValue({ rows: [{ ok: 1 }] });
  pgClient.end.mockReset().mockResolvedValue(undefined);
  containerStops.redis.mockReset().mockResolvedValue(undefined);
  containerStops.postgres.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  for (const key of Object.keys(process.env)) {
    if (!(key in envSnapshot)) delete process.env[key];
  }
  Object.assign(process.env, envSnapshot);
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

function captureExitListeners(): Array<() => void> {
  const listeners: Array<() => void> = [];
  vi.spyOn(process, "on").mockImplementation(((
    event: string | symbol,
    listener: (...args: unknown[]) => void,
  ) => {
    if (event === "exit") {
      listeners.push(listener as () => void);
      return process;
    }
    return REAL_PROCESS_ON(event as never, listener as never);
  }) as typeof process.on);
  return listeners;
}

function mockTmpdir(): void {
  vi.spyOn(os, "tmpdir").mockReturnValue(fixtureRoot);
}

function forkName(pid: string | number, hex = "abcd1234"): string {
  return `SnapOtter-test-${pid}_${hex}`;
}

function writeWorkspace(dir: string): void {
  for (const kind of ["uploads", "outputs"] as const) {
    const nested = path.join(dir, "workspace", kind);
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, "blob.bin"), kind);
  }
}

function envForkDir(): string {
  return path.dirname(process.env.WORKSPACE_PATH ?? "");
}

async function loadPerForkEnv(): Promise<void> {
  vi.resetModules();
  await import("../../setup/per-fork-env.ts");
}

async function loadGlobalSetup(): Promise<typeof import("../../global-setup.ts")> {
  vi.resetModules();
  return import("../../global-setup.ts");
}

function mockProcessProbe(outcomes: Record<number, "esrch" | "eperm" | "error" | "live">): void {
  vi.spyOn(process, "kill").mockImplementation(((pid: number, signal?: NodeJS.Signals | number) => {
    if (signal !== 0) return true;
    const outcome = outcomes[pid] ?? "live";
    if (outcome === "esrch") throw Object.assign(new Error("kill ESRCH"), { code: "ESRCH" });
    if (outcome === "eperm") throw Object.assign(new Error("kill EPERM"), { code: "EPERM" });
    if (outcome === "error") throw new Error("unexpected probe failure");
    return true;
  }) as typeof process.kill);
}

function mockCreateRequire(): void {
  vi.spyOn(nodeModule, "createRequire").mockImplementation(((filename: string) => {
    const req = REAL_CREATE_REQUIRE(filename);
    const wrapped = ((id: string) => {
      if (id === "pg") {
        const stub = {
          connect: async () => {},
          query: async () => ({ rows: [] }),
          end: async () => {},
        };
        const Ctor = function Ctor() {
          return stub;
        };
        return { Client: Ctor, Pool: Ctor };
      }
      if (id === "drizzle-orm/node-postgres") return { drizzle: () => ({}) };
      if (id === "drizzle-orm/node-postgres/migrator") return { migrate: async () => {} };
      return req(id);
    }) as NodeJS.Require;
    return Object.assign(wrapped, req);
  }) as typeof nodeModule.createRequire);
}

describe("per-fork workspace exit cleanup", () => {
  it("removes the captured directory and nested artifacts while keeping siblings", async () => {
    mockTmpdir();
    const listeners = captureExitListeners();
    const sibling = path.join(fixtureRoot, "sibling");
    fs.mkdirSync(sibling);
    fs.writeFileSync(path.join(sibling, "keep.txt"), "keep");
    await loadPerForkEnv();
    expect(listeners).toHaveLength(1);
    const forkDir = envForkDir();
    expect(forkDir.startsWith(fixtureRoot)).toBe(true);
    writeWorkspace(forkDir);
    listeners[0]();
    expect(fs.existsSync(forkDir)).toBe(false);
    expect(fs.existsSync(sibling)).toBe(true);
    listeners[0]();
    expect(fs.existsSync(sibling)).toBe(true);
  });

  it("registers the exit listener before database setup failure", async () => {
    mockTmpdir();
    const listeners = captureExitListeners();
    pgClient.connect.mockRejectedValueOnce(new Error("db down"));
    await expect(loadPerForkEnv()).rejects.toThrow("db down");
    expect(listeners).toHaveLength(1);
    expect(() => listeners[0]()).not.toThrow();
  });

  it("cleans each isolated setup directory instead of only the last WORKSPACE_PATH", async () => {
    mockTmpdir();
    const listeners = captureExitListeners();
    const dirs: string[] = [];
    for (let i = 0; i < 3; i++) {
      await loadPerForkEnv();
      const forkDir = envForkDir();
      expect(forkDir.startsWith(fixtureRoot)).toBe(true);
      writeWorkspace(forkDir);
      dirs.push(forkDir);
    }
    expect(listeners).toHaveLength(3);
    expect(new Set(dirs).size).toBe(3);
    const lastWorkspace = process.env.WORKSPACE_PATH;
    for (const listener of listeners) listener();
    for (const dir of dirs) expect(fs.existsSync(dir)).toBe(false);
    expect(path.dirname(lastWorkspace ?? "")).toBe(dirs[2]);
  });

  it("reports cleanup failures without throwing from the exit listener", async () => {
    mockTmpdir();
    const listeners = captureExitListeners();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await loadPerForkEnv();
    const forkDir = envForkDir();
    writeWorkspace(forkDir);
    vi.spyOn(fs, "rmSync").mockImplementation((target) => {
      if (String(target) === forkDir) throw new Error("busy");
    });
    expect(() => listeners[0]()).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
    expect(fs.existsSync(forkDir)).toBe(true);
  });
});

describe("global teardown workspace sweep", () => {
  it("preserves live, recycled, probe-error, malformed, file, and symlink entries", async () => {
    const outside = fs.mkdtempSync(path.join(REAL_TMPDIR, "ws-cleanup-outside-"));
    try {
      writeWorkspace(outside);
      const preserved = [
        path.join(fixtureRoot, forkName(process.pid)),
        path.join(fixtureRoot, forkName(434343)),
        path.join(fixtureRoot, forkName(444444)),
        path.join(fixtureRoot, forkName(999999)),
        path.join(fixtureRoot, forkName(0)),
        path.join(fixtureRoot, forkName(-5)),
        path.join(fixtureRoot, forkName("9007199254740993")),
        path.join(fixtureRoot, "snapotter-test-888888_ffffffff"),
        path.join(fixtureRoot, "Other-test-424242_abcd1234"),
        path.join(fixtureRoot, forkName(888887, "ABCD1234")),
        path.join(fixtureRoot, forkName(424242, "abcd123")),
        path.join(fixtureRoot, forkName(424242, "abcd12345")),
      ];
      for (const dir of preserved) writeWorkspace(dir);
      const matchingFile = path.join(fixtureRoot, forkName(424242, "file000a"));
      fs.writeFileSync(matchingFile, "not a directory");
      const matchingSymlink = path.join(fixtureRoot, forkName(424242, "aaaaaaa1"));
      fs.symlinkSync(outside, matchingSymlink);
      const dead = path.join(fixtureRoot, forkName(424242));
      writeWorkspace(dead);
      mockTmpdir();
      mockProcessProbe({
        [process.pid]: "live",
        424242: "esrch",
        434343: "eperm",
        444444: "error",
      });
      const { teardown } = await loadGlobalSetup();
      await teardown();
      expect(fs.existsSync(dead)).toBe(false);
      for (const dir of preserved) expect(fs.existsSync(dir), dir).toBe(true);
      expect(fs.existsSync(matchingFile)).toBe(true);
      expect(fs.existsSync(matchingSymlink)).toBe(true);
      expect(fs.existsSync(outside)).toBe(true);
      await teardown();
      await teardown();
    } finally {
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it("continues after a failed removal and still reports the failure", async () => {
    const failing = path.join(fixtureRoot, forkName(424242, "aaaabbbb"));
    const later = path.join(fixtureRoot, forkName(424243, "ccccdddd"));
    writeWorkspace(failing);
    writeWorkspace(later);
    mockTmpdir();
    mockProcessProbe({ 424242: "esrch", 424243: "esrch" });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const actualRmSync = fs.rmSync.bind(fs);
    vi.spyOn(fs, "rmSync").mockImplementation((target, options) => {
      if (String(target) === failing) {
        throw Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" });
      }
      return actualRmSync(target, options);
    });
    const { teardown } = await loadGlobalSetup();
    await teardown();
    expect(fs.existsSync(failing)).toBe(true);
    expect(fs.existsSync(later)).toBe(false);
    expect(warn.mock.calls.some((args) => String(args[0]).includes(failing))).toBe(true);
  });

  it("stops both containers if one rejects, sweeps, and rethrows the original error", async () => {
    delete process.env.TEST_DATABASE_URL;
    delete process.env.TEST_REDIS_URL;
    const dead = path.join(fixtureRoot, forkName(424242));
    writeWorkspace(dead);
    mockTmpdir();
    mockProcessProbe({ 424242: "esrch" });
    mockCreateRequire();
    containerStops.redis.mockRejectedValueOnce(new Error("redis stop failed"));
    const { setup, teardown } = await loadGlobalSetup();
    await setup();
    await expect(teardown()).rejects.toThrow("redis stop failed");
    expect(containerStops.redis).toHaveBeenCalled();
    expect(containerStops.postgres).toHaveBeenCalled();
    expect(fs.existsSync(dead)).toBe(false);
    containerStops.redis.mockResolvedValue(undefined);
    containerStops.postgres.mockRejectedValueOnce(new Error("postgres stop failed"));
    writeWorkspace(dead);
    await setup();
    await expect(teardown()).rejects.toThrow("postgres stop failed");
    expect(containerStops.redis).toHaveBeenCalledTimes(2);
    expect(containerStops.postgres).toHaveBeenCalledTimes(2);
    expect(fs.existsSync(dead)).toBe(false);
  });
});
