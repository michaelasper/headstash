"use client";

import { useState } from "react";

export default function AvatarUpload({ currentUrl }: { currentUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
          {previewUrl || currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl ?? currentUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="text-xs text-neutral-500">
          DEV local upload. PNG/JPG/WebP up to 2MB.
        </div>
      </div>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          setError(null);
          if (f) setPreviewUrl(URL.createObjectURL(f));
          else setPreviewUrl(null);
        }}
      />

      <button
        type="button"
        disabled={!file || busy}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const fd = new FormData();
            fd.append("avatar", file);
            const res = await fetch("/api/profile/avatar", {
              method: "POST",
              body: fd,
            });
            const json = (await res.json().catch(() => null)) as
              | { ok: true; avatarUrl: string }
              | { ok: false; error: string }
              | null;

            if (!res.ok || !json || json.ok === false) {
              setError(json && "error" in json ? json.error : "Upload failed. Please try another file.");
              return;
            }

            // Refresh to show new server-rendered avatarUrl.
            window.location.reload();
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-neutral-200"
      >
        {busy ? "Uploading…" : "Upload avatar"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
