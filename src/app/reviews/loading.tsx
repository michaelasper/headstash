import { Card, Container, PageHeader } from "@/app/_components/ui";

export default function LoadingReviews() {
  return (
    <Container>
      <PageHeader title="Reviews" subtitle="Loading…" />

      <Card>
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </Card>

      <Card>
        <ul className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="space-y-2">
              <div className="h-4 w-44 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
            </li>
          ))}
        </ul>
      </Card>
    </Container>
  );
}
