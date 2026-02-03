import Link from "next/link";

export default function FeedTabs({ active }: { active: "global" | "following" }) {
  const tabClass = (on: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${
      on ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
    }`;

  return (
    <div className="flex gap-2">
      <Link href="/posts" className={tabClass(active === "global")}>
        Global
      </Link>
      <Link href="/posts/following" className={tabClass(active === "following")}>
        Following
      </Link>
    </div>
  );
}
