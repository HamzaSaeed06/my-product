import Link from "next/link";
import type { Parent } from "@/lib/mock/parents";

// A count, not an inline chip list — a parent with 8 children would
// otherwise blow out the row's height/width unpredictably depending on
// how many are linked. The full list (names, class, attendance) lives on
// the parent's own detail page instead, which is exactly what a "show me
// the rest" click should lead to anyway.
export function ChildrenCell({ parent }: { parent: Parent }) {
  const count = parent.children.length;
  return (
    <Link href={`/dashboard/parents/${parent.id}`} className="text-sm text-foreground hover:underline">
      {count === 0 ? "No children" : count === 1 ? "1 child" : `${count} children`}
    </Link>
  );
}
