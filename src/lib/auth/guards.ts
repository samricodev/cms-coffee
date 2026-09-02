import { forbidden, unauthorized } from "@/lib/errors";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw forbidden("Esta acción requiere rol de administrador");
  }
  return user;
}

export function assertCanModifyPost(
  user: SessionUser,
  post: { authorId: string | null },
): void {
  if (user.role === "admin") return;
  if (post.authorId === user.id) return;
  throw forbidden("Solo puedes modificar tus propias entradas");
}
