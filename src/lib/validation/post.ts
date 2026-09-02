import { z } from "zod";

const fields = {
  title: z.string().trim().min(1, "El título no puede estar vacío").max(200),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo admite minúsculas, números y guiones",
    )
    .max(80),
  excerpt: z.string().trim().max(300).nullable(),
  body: z.string(),
  status: z.enum(["draft", "published"]),
};


export const createPostSchema = z.object({
  title: fields.title,
  // Si no se envía slug, se deriva del título.
  slug: fields.slug.optional(),
  excerpt: fields.excerpt.optional(),
  body: fields.body.default(""),
  status: fields.status.default("draft"),
});

export const updatePostSchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Envía al menos un campo para actualizar",
  });

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  status: z.enum(["draft", "published"]).optional().catch(undefined),
  q: z.string().trim().min(1).optional().catch(undefined),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
