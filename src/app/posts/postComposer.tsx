"use client";

import { useActionState } from "react";

import { createPost, type CreatePostState } from "@/app/posts/actions";
import { Field, inputClassName } from "@/app/_components/ui";

type ReviewOption = {
  id: string;
  label: string;
};

export default function PostComposer({
  reviews,
}: {
  reviews: ReviewOption[];
}) {
  const [state, action, pending] = useActionState<CreatePostState, FormData>(
    createPost,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="New post">
        <textarea
          name="body"
          required
          rows={4}
          className={inputClassName}
          placeholder="What’s on your mind?"
        />
      </Field>

      <Field label="Attach a review" hint="Optional">
        <select name="reviewId" className={inputClassName} defaultValue="">
          <option value="">—</option>
          {reviews.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
      >
        {pending ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
