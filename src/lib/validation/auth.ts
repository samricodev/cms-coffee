import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const createUserSchema = z.object({
  email: z.email("Email no válido"),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(12, "Usa al menos 12 caracteres"),
  role: z.enum(["admin", "editor"]).default("editor"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
