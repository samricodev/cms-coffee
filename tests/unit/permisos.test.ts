import { describe, expect, it } from "vitest";

import { assertCanModify } from "@/lib/auth/guards";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";

const admin: SessionUser = {
  id: crypto.randomUUID(),
  email: "admin@test.local",
  name: "Admin",
  role: "admin",
};

const editor: SessionUser = {
  id: crypto.randomUUID(),
  email: "editor@test.local",
  name: "Editor",
  role: "editor",
};

function motivo(fn: () => void): AppError {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("se esperaba un AppError y no se lanzó ninguno");
}

describe("propiedad del contenido", () => {
  it("un editor modifica lo suyo", () => {
    expect(() => assertCanModify(editor, { authorId: editor.id })).not.toThrow();
  });

  it("un editor NO modifica lo de otro", () => {
    const error = motivo(() => assertCanModify(editor, { authorId: admin.id }));
    expect(error.code).toBe("forbidden");
  });

  it("un editor NO modifica contenido sin autor", () => {
    expect(motivo(() => assertCanModify(editor, { authorId: null })).code).toBe(
      "forbidden",
    );
  });

  it("un administrador modifica cualquier cosa", () => {
    expect(() => assertCanModify(admin, { authorId: editor.id })).not.toThrow();
    expect(() => assertCanModify(admin, { authorId: null })).not.toThrow();
  });

  it("prohibido es 403, no 401: volver a entrar no cambiaría nada", () => {
    expect(motivo(() => assertCanModify(editor, { authorId: admin.id })).code).not.toBe(
      "unauthorized",
    );
  });
});
