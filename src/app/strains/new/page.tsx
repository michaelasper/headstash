import Link from "next/link";

import { createStrain } from "@/app/actions";
import {
  Card,
  Container,
  Field,
  PageHeader,
  inputClassName,
} from "@/app/_components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New strain",
};

export default function NewStrainPage() {
  return (
    <Container>
      <PageHeader
        title="New strain"
        subtitle="Add a strain to review later."
        right={
          <Link href="/strains" className="text-sm text-neutral-600 hover:underline">
            Back
          </Link>
        }
      />

      <Card>
        <form action={createStrain} className="flex flex-col gap-4">
          <Field label="Name">
            <input
              name="name"
              required
              autoFocus
              className={inputClassName}
              placeholder="e.g., Blue Dream"
            />
          </Field>

          <Field label="Brand / grower" hint="Optional">
            <input
              name="brand"
              className={inputClassName}
              placeholder="e.g., Some Farm"
            />
          </Field>

          <Field label="Type" hint="Optional">
            <select name="type" className={inputClassName} defaultValue="">
              <option value="">—</option>
              <option value="INDICA">Indica</option>
              <option value="SATIVA">Sativa</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </Field>

          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Create strain
          </button>
        </form>
      </Card>
    </Container>
  );
}
