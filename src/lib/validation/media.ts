import { z } from "zod";

export const MAX_ALT_LENGTH = 180;

export const mediaAltSchema = z
  .string()
  .trim()
  .max(MAX_ALT_LENGTH, `El texto alternativo no puede pasar de ${MAX_ALT_LENGTH} caracteres`)
  .transform((value) => (value === "" ? null : value));
