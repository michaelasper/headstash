import { Card, Container, PageHeader } from "@/app/_components/ui";

export default function LoadingPost() {
  return (
    <Container>
      <PageHeader title="Post" subtitle="Loading…" />
      <Card>
        <div className="space-y-3">
          <div className="h-4 w-44 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
          <div className="h-20 w-full animate-pulse rounded bg-neutral-100" />
        </div>
      </Card>
      <Card>
        <div className="h-24 w-full animate-pulse rounded bg-neutral-100" />
      </Card>
      <Card>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
      </Card>
    </Container>
  );
}
