import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const createUserSchema = z.object({
  email: z.email("Email no válido"),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(12, "Usa al menos 12 caracteres").max(200),
  role: z.enum(["admin", "editor"]).default("editor"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;

const password = z.string().min(12, "Usa al menos 12 caracteres").max(200);

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Escribe tu contraseña actual"),
    next: password,
    repeat: z.string(),
  })
  .refine((value) => value.next === value.repeat, {
    path: ["repeat"],
    message: "Las contraseñas no coinciden",
  })
  .refine((value) => value.next !== value.current, {
    path: ["next"],
    message: "La nueva contraseña debe ser distinta de la actual",
  });

export const resetPasswordSchema = z.object({
  password,
});

export const updateUserSchema = z
  .object({
    role: z.enum(["admin", "editor"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Envía al menos un campo para actualizar",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
