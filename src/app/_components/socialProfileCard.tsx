import Link from "next/link";

type AuthorLike = {
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
};

function displayName(author: Pick<AuthorLike, "displayName" | "handle">) {
  return author.displayName ?? author.handle ?? "Member";
}

function cleanHandle(handle: string | null) {
  if (!handle) return null;
  return handle.replace(/^@/, "");
}

export function SocialProfileInline({
  author,
  timestamp,
  right,
  meta,
  size = "md",
}: {
  author: AuthorLike;
  timestamp?: string;
  right?: React.ReactNode;
  meta?: React.ReactNode;
  size?: "sm" | "md";
}) {
  const slug = cleanHandle(author.handle);
  const avatarSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const nameText = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-start gap-3">
      <div className={`${avatarSize} overflow-hidden rounded-full border border-border bg-muted`}>
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className={`truncate ${nameText} font-medium leading-tight text-foreground`}>
            {slug ? (
              <Link href={`/u/${slug}`} className="hover:underline">
                {displayName(author)}
              </Link>
            ) : (
              displayName(author)
            )}
          </div>

          <div className="flex items-center gap-2">
            {right}
            {timestamp ? (
              <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                {timestamp}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {author.handle ? <span>@{cleanHandle(author.handle)}</span> : null}
          {meta}
        </div>
      </div>
    </div>
  );
}
