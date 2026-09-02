"use client";

import { useActionState } from "react";

import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf, type FormState } from "@/lib/form";
import type { Post } from "@/db/schema";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  post?: Post;
  submitLabel: string;
};

export function PostForm({ action, post, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, idleForm);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <label className={label} htmlFor="title">
          Título
        </label>
        <input
          className={input}
          id="title"
          name="title"
          defaultValue={post?.title}
          required
        />
        <FieldError message={issueOf(state, "title")} />
      </div>

      <div>
        <label className={label} htmlFor="slug">
          Slug
        </label>
        <input
          className={input}
          id="slug"
          name="slug"
          defaultValue={post?.slug}
          placeholder={post ? undefined : "Se genera a partir del título"}
        />
        <FieldError message={issueOf(state, "slug")} />
      </div>

      <div>
        <label className={label} htmlFor="excerpt">
          Extracto
        </label>
        <input
          className={input}
          id="excerpt"
          name="excerpt"
          defaultValue={post?.excerpt ?? ""}
        />
        <FieldError message={issueOf(state, "excerpt")} />
      </div>

      <div>
        <label className={label} htmlFor="body">
          Contenido
        </label>
        <textarea
          className={`${input} min-h-60 font-mono`}
          id="body"
          name="body"
          defaultValue={post?.body}
        />
        <FieldError message={issueOf(state, "body")} />
      </div>

      <div>
        <label className={label} htmlFor="status">
          Estado
        </label>
        <select
          className={input}
          id="status"
          name="status"
          defaultValue={post?.status ?? "draft"}
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
        </select>
        <FieldError message={issueOf(state, "status")} />
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
