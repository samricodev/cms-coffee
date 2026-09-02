import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { deletePostAction, updatePostAction } from "@/app/admin/actions";
import { PostForm } from "@/components/post-form";
import { SubmitButton } from "@/components/submit-button";
import { danger, secondary } from "@/components/ui";
import { assertCanModifyPost } from "@/lib/auth/guards";
import { requireUser } from "@/lib/auth/guards";
import { AppError } from "@/lib/errors";
import { getPostById } from "@/lib/posts";

export default async function EditPostPage({
  params,
}: PageProps<"/admin/posts/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  if (!z.uuid().safeParse(id).success) notFound();

  const post = await getPostById(id).catch((error) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });

  let canModify = true;
  try {
    assertCanModifyPost(user, post);
  } catch {
    canModify = false;
  }

  if (!canModify) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{post.title}</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Esta entrada es de otro autor, así que solo puedes leerla.
        </p>
        <pre className="whitespace-pre-wrap text-sm">{post.body}</pre>
        <Link href="/admin" className={secondary}>
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Editar entrada</h1>
        <Link href="/admin" className={`${secondary} ml-auto`}>
          Volver
        </Link>
      </div>

      <PostForm
        action={updatePostAction.bind(null, post.id)}
        post={post}
        submitLabel="Guardar cambios"
      />

      <form action={deletePostAction.bind(null, post.id)}>
        <SubmitButton className={danger} pendingLabel="Borrando…">
          Borrar entrada
        </SubmitButton>
      </form>
    </div>
  );
}
