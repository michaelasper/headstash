import Link from "next/link";

import { createTag } from "@/app/actions";
import {
  Card,
  Container,
  Field,
  PageHeader,
  inputClassName,
} from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New tag",
};

export default function NewTagPage() {
  return (
    <Container>
      <PageHeader
        title="New tag"
        subtitle="Add a new effect or terpene tag for review filters."
        right={
          <Link href="/tags" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        <form action={createTag} className="flex flex-col gap-4">
          <Field label="Kind">
            <select name="kind" className={inputClassName} defaultValue="EFFECT">
              <option value="EFFECT">Effect</option>
              <option value="TERPENE">Terpene</option>
            </select>
          </Field>

          <Field label="Name">
            <input
              name="name"
              required
              autoFocus
              className={inputClassName}
              placeholder="e.g., Relaxed / Limonene"
            />
          </Field>

          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Create tag
          </button>
        </form>
      </Card>
    </Container>
  );
}
