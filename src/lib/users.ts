import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { conflict, unauthorized } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import type { CreateUserInput, LoginInput } from "@/lib/validation/auth";

// Iguala el tiempo de respuesta cuando el email no existe.
const DUMMY_HASH_PROMISE = hashPassword("contraseña-que-nunca-nadie-usará");

export async function listUsers(): Promise<SessionUser[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
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

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
