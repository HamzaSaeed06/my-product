import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateParentDialog, LinkChildDialog } from "./parent-dialogs";
import { UnlinkChildButton } from "./unlink-child-button";

interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  children: {
    id: string;
    relationship: string | null;
    isPrimary: boolean;
    student: { id: string; studentCode: string; fullName: string };
  }[];
}

interface Student {
  id: string;
  studentCode: string;
  fullName: string;
}

export default async function ParentsPage() {
  // Mirrors parent.create/parent.edit from routes.ts — parent.edit gates
  // three separate write routes (PATCH /:parentId, POST /:parentId/children
  // link, DELETE /:parentId/children/:linkId unlink), so it gates both the
  // "Link child" dialog and the "Unlink" button. The students fetch exists
  // only to feed "Link child"'s picker (each parent's linked children
  // render from the parent's own embedded `children[].student`, not this
  // list), so it's gated the same way rather than fetched unconditionally.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("parent.create");
  const canEdit = permissions.includes("parent.edit");

  const [parents, students] = await Promise.all([
    apiRequest<Parent[]>("/api/v1/parents"),
    canEdit ? apiRequest<Student[]>("/api/v1/students?status=ACTIVE") : Promise.resolve<Student[]>([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Parents"
        description="Guardians and their linked children — a parent can have multiple children."
        action={canCreate ? <CreateParentDialog /> : undefined}
      />

      {parents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No parents yet. Click &quot;Add parent&quot; to create one.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {parents.map((parent) => (
            <div key={parent.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{parent.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {parent.phone}
                    {parent.email ? ` · ${parent.email}` : ""}
                  </p>
                </div>
                {canEdit && <LinkChildDialog parentId={parent.id} students={students} />}
              </div>

              {parent.children.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                  {parent.children.map((link) => (
                    <div key={link.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        {link.student.fullName}{" "}
                        <span className="text-muted-foreground">
                          ({link.student.studentCode}
                          {link.relationship ? ` · ${link.relationship}` : ""})
                        </span>
                      </span>
                      {canEdit && (
                        <UnlinkChildButton parentId={parent.id} linkId={link.id} studentName={link.student.fullName} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">No children linked yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
