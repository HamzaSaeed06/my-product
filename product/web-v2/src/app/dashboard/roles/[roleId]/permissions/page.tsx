import { notFound } from "next/navigation";
import { mockRoles } from "@/lib/mock/roles";
import { PermissionsForm } from "./permissions-form";

export default async function RolePermissionsPage({ params }: PageProps<"/dashboard/roles/[roleId]/permissions">) {
  const { roleId } = await params;
  const role = mockRoles.find((r) => r.id === roleId);
  if (!role) notFound();

  return <PermissionsForm role={role} />;
}
