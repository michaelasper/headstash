"use client";

import { useActionState } from "react";

import { Field, inputClassName } from "@/app/_components/ui";
import { createComment, type CreateCommentState } from "@/app/posts/[id]/actions";

export default function CommentForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState<CreateCommentState, FormData>(
    createComment,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="postId" value={postId} />
      <Field label="Add a comment">
        <textarea
          name="body"
          required
          rows={3}
          className={inputClassName}
          placeholder="Write a comment…"
        />
      </Field>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
