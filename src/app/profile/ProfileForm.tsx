"use client";

import { useActionState } from "react";

import type { UpdateProfileState } from "@/app/profile/actions";
import { updateProfile } from "@/app/profile/actions";
import { Card, Field, inputClassName } from "@/app/_components/ui";
import AvatarUpload from "@/app/profile/AvatarUpload";

export default function ProfileForm({
  initial,
}: {
  initial: {
    displayName: string;
    handle: string;
    bio: string;
    avatarUrl: string;
    linksText: string;
  };
}) {
  const [state, action, pending] = useActionState<UpdateProfileState, FormData>(
    updateProfile,
    {},
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Avatar (dev-local)</div>
          <AvatarUpload currentUrl={initial.avatarUrl} />
        </div>
      </Card>

      <Card>
        <form action={action} className="flex flex-col gap-4">
          <Field label="Display name" hint="Optional">
            <input
              name="displayName"
              className={inputClassName}
              defaultValue={initial.displayName}
            />
            {state.fieldErrors?.displayName ? (
              <p className="text-xs text-red-600">
                {state.fieldErrors.displayName}
              </p>
            ) : null}
          </Field>

          <Field
            label="Handle"
            hint="Required for public profile later (format: @name)"
          >
            <input
              name="handle"
              className={inputClassName}
              defaultValue={initial.handle}
              placeholder="@your_handle"
            />
            {state.fieldErrors?.handle ? (
              <p className="text-xs text-red-600">{state.fieldErrors.handle}</p>
            ) : null}
          </Field>

          <Field label="Bio" hint="Optional">
            <textarea
              name="bio"
              className={inputClassName}
              rows={4}
              defaultValue={initial.bio}
              placeholder="A short bio…"
            />
            {state.fieldErrors?.bio ? (
              <p className="text-xs text-red-600">{state.fieldErrors.bio}</p>
            ) : null}
          </Field>

          <Field label="Avatar URL" hint="Optional (or use upload above)">
            <input
              name="avatarUrl"
              className={inputClassName}
              defaultValue={initial.avatarUrl}
              placeholder="https://…"
            />
            {state.fieldErrors?.avatarUrl ? (
              <p className="text-xs text-red-600">{state.fieldErrors.avatarUrl}</p>
            ) : null}
          </Field>

          <Field label="Links" hint="Optional. One URL per line. Max 5.">
            <textarea
              name="links"
              className={inputClassName}
              rows={5}
              defaultValue={initial.linksText}
              placeholder="https://example.com\nhttps://…"
            />
            {state.fieldErrors?.links ? (
              <p className="text-xs text-red-600">{state.fieldErrors.links}</p>
            ) : null}
          </Field>

          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          {state.ok ? <p className="text-sm text-green-700">Saved.</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
        </form>
      </Card>
    </div>
  );
}
