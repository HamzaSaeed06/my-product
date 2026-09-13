"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Combobox } from "@/components/combobox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { AppUser } from "@/lib/mock/app-users";
import { mockRoles } from "@/lib/mock/roles";
import { mockCampuses } from "@/lib/mock/campuses";

const ROLE_OPTIONS = mockRoles.map((r) => ({ value: r.id, label: r.name }));
const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));

// Roles live entirely in this one Sheet rather than scattered
// popovers/dialogs per badge — assigning and removing are two sides of
// the same "who can this person act as" task, so they belong together.
// Removing a role is a real Alert Dialog, not a plain button: it revokes
// immediately and kills the user's active sessions, same weight as
// deactivating the whole account.
export function ManageRolesSheet({
  user,
  open,
  onOpenChange,
}: {
  user: AppUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [newRoleId, setNewRoleId] = useState<string | null>(null);
  const [newCampusId, setNewCampusId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const selectedRoleDef = mockRoles.find((r) => r.id === newRoleId);

  function handleAdd() {
    toast.success(`${selectedRoleDef?.name} granted to ${user.fullName}.`);
    setNewRoleId(null);
    setNewCampusId(null);
  }

  const removingRole = user.roles.find((r) => r.userRoleId === removeTarget);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col gap-0">
          <SheetHeader>
            <SheetTitle>Manage roles — {user.fullName}</SheetTitle>
            <SheetDescription>A user can hold multiple roles, each optionally scoped to one campus.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
            <Field>
              <FieldLabel>Current roles</FieldLabel>
              {user.roles.length ? (
                <div className="flex flex-col divide-y divide-border rounded-[var(--card-radius)] border border-border">
                  {user.roles.map((r) => (
                    <div key={r.userRoleId} className="flex items-center justify-between px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{r.roleName}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.campusId ? mockCampuses.find((c) => c.id === r.campusId)?.name : "All campuses"}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => setRemoveTarget(r.userRoleId)}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No roles yet — this user has no access.</p>
              )}
            </Field>

            <Field>
              <FieldLabel>Grant a role</FieldLabel>
              <Combobox options={ROLE_OPTIONS} value={newRoleId} onChange={setNewRoleId} placeholder="Select a role" />
            </Field>
            {selectedRoleDef?.requiresCampus ? (
              <Field>
                <FieldLabel>Campus</FieldLabel>
                <Combobox options={CAMPUS_OPTIONS} value={newCampusId} onChange={setNewCampusId} placeholder="Required for this role" />
              </Field>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={!newRoleId || (!!selectedRoleDef?.requiresCampus && !newCampusId)}
              onClick={handleAdd}
            >
              Grant role
            </Button>
          </div>
          <SheetFooter className="mt-auto flex-row justify-end border-t border-border pt-4">
            <SheetClose render={<Button variant="outline" />}>Done</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        title={`Remove ${removingRole?.roleName ?? "this role"}?`}
        description="Takes effect immediately and kills this user's active sessions."
        confirmLabel="Remove role"
        successMessage="Role removed."
        onConfirm={() => setRemoveTarget(null)}
      />
    </>
  );
}
