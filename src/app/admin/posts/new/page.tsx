import { createPostAction } from "@/app/admin/actions";
import { PostForm } from "@/components/post-form";
import { requireUser } from "@/lib/auth/guards";

export default async function NewPostPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Nueva entrada</h1>
      <PostForm action={createPostAction} submitLabel="Crear" />
    </div>
  );
}
