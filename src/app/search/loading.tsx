import { Card, Container, PageHeader } from "@/app/_components/ui";

export default function LoadingSearch() {
  return (
    <Container>
      <PageHeader title="Search" subtitle="Loading…" />
      <Card>
        <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
      </Card>
      <Card>
        <div className="h-5 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
      </Card>
      <Card>
        <div className="h-5 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
      </Card>
    </Container>
  );
}
