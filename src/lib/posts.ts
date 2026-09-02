import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { assertCanModify } from "@/lib/auth/guards";
import type { SessionUser } from "@/lib/auth/session";
import { posts, users, type Post } from "@/db/schema";
import { conflict, notFound } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import type {
  CreatePostInput,
  ListPostsQuery,
  UpdatePostInput,
} from "@/lib/validation/post";

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  while (current instanceof Error) {
    if ((current as { code?: string }).code === PG_UNIQUE_VIOLATION) return true;
    current = current.cause;
  }

  return false;
}

export type PostListItem = Post & { authorName: string | null };

export type PaginatedPosts = {
  items: PostListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function listPosts(query: ListPostsQuery): Promise<PaginatedPosts> {
  const { page, limit, status, q } = query;

  const filters = [
    status ? eq(posts.status, status) : undefined,
    q ? or(ilike(posts.title, `%${q}%`), ilike(posts.body, `%${q}%`)) : undefined,
  ];
  const where = and(...filters);

  const [items, [totals]] = await Promise.all([
    db
      .select({ ...getTableColumns(posts), authorName: users.name })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(posts).where(where),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total: totals.value,
      totalPages: Math.max(1, Math.ceil(totals.value / limit)),
    },
  };
}

export async function getPostById(id: string): Promise<Post> {
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) throw notFound(`No existe ninguna entrada con id ${id}`);
  return post;
}

export async function createPost(
  input: CreatePostInput,
  actor: SessionUser,
): Promise<Post> {
  const slug = input.slug ?? slugify(input.title);
  if (!slug) {
    throw conflict("No se pudo derivar un slug del título; envía uno explícito");
  }

  try {
    const [created] = await db
      .insert(posts)
      .values({
        title: input.title,
        slug,
        excerpt: input.excerpt ?? null,
        body: input.body,
        status: input.status,
        authorId: actor.id,
        // Regla de negocio: publishedAt marca cuándo se publicó por primera vez.
        publishedAt: input.status === "published" ? new Date() : null,
      })
      .returning();
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(`Ya existe una entrada con el slug "${slug}"`);
    }
    throw error;
  }
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
  actor: SessionUser,
): Promise<Post> {
  const current = await getPostById(id);
  assertCanModify(actor, current);

  const becomesPublished =
    input.status === "published" && current.publishedAt === null;

  try {
    const [updated] = await db
      .update(posts)
      .set({
        ...input,
        ...(becomesPublished ? { publishedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(`Ya existe una entrada con el slug "${input.slug}"`);
    }
    throw error;
  }
}

export async function deletePost(id: string, actor: SessionUser): Promise<void> {
  const current = await getPostById(id);
  assertCanModify(actor, current);

  await db.delete(posts).where(eq(posts.id, id));
}
