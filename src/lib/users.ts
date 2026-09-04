import { and, asc, count, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { conflict, forbidden, notFound, unauthorized } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import type {
  ChangePasswordInput,
  CreateUserInput,
  LoginInput,
  UpdateUserInput,
} from "@/lib/validation/auth";

// Iguala el tiempo de respuesta cuando el email no existe.
const DUMMY_HASH_PROMISE = hashPassword("contraseña-que-nunca-nadie-usará");

export type ManagedUser = SessionUser & { active: boolean };

export async function listUsers(): Promise<ManagedUser[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .orderBy(asc(users.createdAt));
}

export async function createUser(input: CreateUserInput): Promise<SessionUser> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) throw conflict(`Ya existe un usuario con el email ${input.email}`);

  const [created] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: input.role,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  return created;
}

export async function authenticate(input: LoginInput): Promise<SessionUser> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  const valid = user
    ? await verifyPassword(user.passwordHash, input.password)
    : await verifyPassword(await DUMMY_HASH_PROMISE, input.password);

  if (!user || !valid) throw unauthorized("Email o contraseña incorrectos");

  /**
   * Una cuenta desactivada da el mismo mensaje que una credencial incorrecta:
   * decir "esta cuenta está desactivada" confirma que el email existe.
   */
  if (!user.active) throw unauthorized("Email o contraseña incorrectos");

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}


/** Cierra todas las sesiones de un usuario, salvo la que se indique. */
async function cerrarSesiones(userId: string, exceptoHash?: string) {
  await db
    .delete(sessions)
    .where(
      exceptoHash
        ? and(eq(sessions.userId, userId), ne(sessions.tokenHash, exceptoHash))
        : eq(sessions.userId, userId),
    );
}

async function cargar(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw notFound(`No existe el usuario ${userId}`);
  return user;
}

/**
 * Impide quedarse sin administradores activos. Sin esto, un admin puede
 * desactivarse o degradarse a sí mismo y dejar el panel sin nadie que pueda
 * gestionar cuentas: el arreglo sería SQL a mano.
 */
async function asegurarQuedaUnAdmin(userId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, userId)));

  if (value === 0) {
    throw conflict("Debe quedar al menos un administrador activo");
  }
}

export async function changeOwnPassword(
  actor: SessionUser,
  input: ChangePasswordInput,
  currentTokenHash?: string,
): Promise<void> {
  const user = await cargar(actor.id);

  if (!(await verifyPassword(user.passwordHash, input.current))) {
    throw unauthorized("La contraseña actual no es correcta");
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(input.next) })
    .where(eq(users.id, actor.id));

  // Cambiar la contraseña expulsa al resto de dispositivos, que es justo lo que
  // se espera de este gesto cuando sospechas que alguien entró.
  await cerrarSesiones(actor.id, currentTokenHash);
}

export async function resetPassword(
  actor: SessionUser,
  userId: string,
  password: string,
): Promise<ManagedUser> {
  const user = await cargar(userId);

  const [updated] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
    });

  // Un reseteo hecho por otra persona invalida TODAS las sesiones, incluida la
  // del propio usuario: si le han robado la cuenta, sigue dentro hasta que se
  // cierren.
  await cerrarSesiones(user.id);

  return updated;
}

export async function updateUser(
  actor: SessionUser,
  userId: string,
  input: UpdateUserInput,
): Promise<ManagedUser> {
  const user = await cargar(userId);

  if (user.id === actor.id) {
    if (input.active === false) throw forbidden("No puedes desactivar tu propia cuenta");
    if (input.role && input.role !== user.role) {
      throw forbidden("No puedes cambiarte el rol a ti mismo");
    }
  }

  const dejaDeSerAdminActivo =
    (input.role === "editor" && user.role === "admin") ||
    (input.active === false && user.role === "admin");

  if (dejaDeSerAdminActivo) await asegurarQuedaUnAdmin(user.id);

  const [updated] = await db
    .update(users)
    .set({
      ...(input.role ? { role: input.role } : {}),
      ...(input.active === undefined ? {} : { active: input.active }),
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
    });

  // Desactivar debe echar a quien ya estaba dentro, no solo impedir entrar.
  if (input.active === false) await cerrarSesiones(user.id);

  return updated;
}
