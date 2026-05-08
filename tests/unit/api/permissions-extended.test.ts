import type { Permission, Role } from "@snapotter/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../apps/api/src/db/index.js", () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ get: () => null }) }),
    }),
  },
  schema: { roles: {}, settings: {} },
}));

const mockGetAuthUser = vi.fn();
vi.mock("../../../apps/api/src/plugins/auth.js", () => ({
  getAuthUser: (...args: unknown[]) => mockGetAuthUser(...args),
}));

import {
  hasEffectivePermission,
  hasPermission,
  requireOwnershipOrPermission,
  requirePermission,
} from "../../../apps/api/src/permissions.js";
import type { AuthUser } from "../../../apps/api/src/plugins/auth.js";

function makeUser(overrides: Partial<AuthUser> & { role: string }): AuthUser {
  return {
    id: "u-test",
    username: "tester",
    ...overrides,
  };
}

function makeMockReply() {
  const sent: { status?: number; body?: unknown } = {};
  const reply = {
    status(code: number) {
      sent.status = code;
      return reply;
    },
    send(body: unknown) {
      sent.body = body;
      return reply;
    },
  };
  return { reply, sent };
}

beforeEach(() => {
  mockGetAuthUser.mockReset();
});

describe("hasPermission extended", () => {
  const adminPerms: Permission[] = [
    "tools:use",
    "files:own",
    "files:all",
    "apikeys:own",
    "apikeys:all",
    "pipelines:own",
    "pipelines:all",
    "settings:read",
    "settings:write",
    "users:manage",
    "teams:manage",
    "features:manage",
    "system:health",
    "audit:read",
  ];

  it("admin has all 14 permissions", () => {
    for (const perm of adminPerms) {
      expect(hasPermission("admin", perm)).toBe(true);
    }
  });

  it("editor has the expected permissions", () => {
    const editorYes: Permission[] = [
      "tools:use",
      "files:own",
      "files:all",
      "apikeys:own",
      "pipelines:own",
      "pipelines:all",
      "settings:read",
    ];
    for (const perm of editorYes) {
      expect(hasPermission("editor", perm)).toBe(true);
    }
  });

  it("editor does NOT have admin-only permissions", () => {
    const editorNo: Permission[] = [
      "users:manage",
      "teams:manage",
      "settings:write",
      "features:manage",
      "system:health",
      "audit:read",
    ];
    for (const perm of editorNo) {
      expect(hasPermission("editor", perm)).toBe(false);
    }
  });

  it("user has the expected permissions", () => {
    const userYes: Permission[] = [
      "tools:use",
      "files:own",
      "apikeys:own",
      "pipelines:own",
      "settings:read",
    ];
    for (const perm of userYes) {
      expect(hasPermission("user", perm)).toBe(true);
    }
  });

  it("user does NOT have elevated permissions", () => {
    const userNo: Permission[] = [
      "files:all",
      "pipelines:all",
      "users:manage",
      "teams:manage",
      "settings:write",
      "features:manage",
      "apikeys:all",
      "system:health",
      "audit:read",
    ];
    for (const perm of userNo) {
      expect(hasPermission("user", perm)).toBe(false);
    }
  });

  it("unknown role returns false for any permission", () => {
    expect(hasPermission("ghost" as Role, "tools:use")).toBe(false);
    expect(hasPermission("ghost" as Role, "users:manage")).toBe(false);
  });
});

describe("hasEffectivePermission extended", () => {
  it("admin without apiKeyPermissions has all permissions", () => {
    const admin = makeUser({ role: "admin" });
    expect(hasEffectivePermission(admin, "tools:use")).toBe(true);
    expect(hasEffectivePermission(admin, "users:manage")).toBe(true);
    expect(hasEffectivePermission(admin, "audit:read")).toBe(true);
  });

  it("user with apiKeyPermissions only gets intersecting permissions", () => {
    const user = makeUser({
      role: "user",
      apiKeyPermissions: ["tools:use", "settings:read"],
    });
    expect(hasEffectivePermission(user, "tools:use")).toBe(true);
    expect(hasEffectivePermission(user, "settings:read")).toBe(true);
    expect(hasEffectivePermission(user, "files:own")).toBe(false);
  });

  it("apiKeyPermissions that include the permission returns true", () => {
    const editor = makeUser({
      role: "editor",
      apiKeyPermissions: ["files:all"],
    });
    expect(hasEffectivePermission(editor, "files:all")).toBe(true);
  });

  it("apiKeyPermissions that do NOT include the permission returns false", () => {
    const editor = makeUser({
      role: "editor",
      apiKeyPermissions: ["tools:use"],
    });
    expect(hasEffectivePermission(editor, "files:all")).toBe(false);
  });

  it("role lacking the permission returns false even if apiKeyPermissions include it", () => {
    const user = makeUser({
      role: "user",
      apiKeyPermissions: ["users:manage", "settings:write"],
    });
    expect(hasEffectivePermission(user, "users:manage")).toBe(false);
    expect(hasEffectivePermission(user, "settings:write")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("returns null and sends 401 when getAuthUser returns null", () => {
    mockGetAuthUser.mockReturnValue(null);
    const { reply, sent } = makeMockReply();
    const result = requirePermission("tools:use")({} as never, reply as never);
    expect(result).toBeNull();
    expect(sent.status).toBe(401);
    expect(sent.body).toEqual({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
  });

  it("returns null and sends 403 when user lacks permission", () => {
    mockGetAuthUser.mockReturnValue(makeUser({ role: "user" }));
    const { reply, sent } = makeMockReply();
    const result = requirePermission("users:manage")({} as never, reply as never);
    expect(result).toBeNull();
    expect(sent.status).toBe(403);
    expect(sent.body).toEqual({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    });
  });

  it("returns user when user has the permission", () => {
    const admin = makeUser({ role: "admin" });
    mockGetAuthUser.mockReturnValue(admin);
    const { reply } = makeMockReply();
    const result = requirePermission("users:manage")({} as never, reply as never);
    expect(result).toEqual(admin);
  });

  it("returns user when editor has an editor-level permission", () => {
    const editor = makeUser({ role: "editor" });
    mockGetAuthUser.mockReturnValue(editor);
    const { reply } = makeMockReply();
    const result = requirePermission("tools:use")({} as never, reply as never);
    expect(result).toEqual(editor);
  });
});

describe("requireOwnershipOrPermission", () => {
  it("returns null and sends 401 when no user", () => {
    mockGetAuthUser.mockReturnValue(null);
    const { reply, sent } = makeMockReply();
    const result = requireOwnershipOrPermission(
      {} as never,
      reply as never,
      "other-user",
      "files:all",
    );
    expect(result).toBeNull();
    expect(sent.status).toBe(401);
  });

  it("returns user when resourceUserId matches user.id (own resource)", () => {
    const user = makeUser({ role: "user", id: "u-owner" });
    mockGetAuthUser.mockReturnValue(user);
    const { reply } = makeMockReply();
    const result = requireOwnershipOrPermission(
      {} as never,
      reply as never,
      "u-owner",
      "files:all",
    );
    expect(result).toEqual(user);
  });

  it("returns user when user has the allPermission", () => {
    const admin = makeUser({ role: "admin", id: "u-admin" });
    mockGetAuthUser.mockReturnValue(admin);
    const { reply } = makeMockReply();
    const result = requireOwnershipOrPermission(
      {} as never,
      reply as never,
      "u-someone-else",
      "files:all",
    );
    expect(result).toEqual(admin);
  });

  it("returns null when not owner and lacks allPermission", () => {
    const user = makeUser({ role: "user", id: "u-basic" });
    mockGetAuthUser.mockReturnValue(user);
    const { reply } = makeMockReply();
    const result = requireOwnershipOrPermission(
      {} as never,
      reply as never,
      "u-someone-else",
      "files:all",
    );
    expect(result).toBeNull();
  });
});
