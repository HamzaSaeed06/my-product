"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { createUser, assignRole, removeRole, setUserActive } from "./actions";

interface RoleOption {
  id: string;
  name: string;
}
interface CampusOption {
  id: string;
  name: string;
}

export function CreateUserDialog() {
  return (
    <FormDialog
      triggerLabel="+ Add user"
      title="Add a user"
      description="Creates a login account. Assign a role next so they can actually access anything."
      action={createUser}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
        <p className="text-xs text-muted-foreground">8+ characters, with upper, lower, number, and special character.</p>
      </div>
    </FormDialog>
  );
}

// Campus Head/Office are campus-scoped roles — the backend
// refuses assigning either with no campusId (CAMPUS_REQUIRED_FOR_ROLE,
// added alongside the 2026-09-12 campus-scoping work, since scope.ts now
// derives their entire visibility from this field). Mirrored here so the
// form actually guides the user to the right thing instead of the old
// (now-incorrect) advice to leave it blank for these two roles.
const CAMPUS_REQUIRED_ROLE_NAMES = new Set(["CAMPUS_HEAD", "OFFICE"]);

export function AssignRoleDialog({
  userId,
  userName,
  roles,
  campuses,
}: {
  userId: string;
  userName: string;
  roles: RoleOption[];
  campuses: CampusOption[];
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const campusRequired = selectedRole ? CAMPUS_REQUIRED_ROLE_NAMES.has(selectedRole.name) : false;

  return (
    <FormDialog
      triggerLabel="Assign role"
      title={`Assign a role to ${userName}`}
      description={
        campusRequired
          ? `${selectedRole!.name} is a campus-scoped role — pick which campus this assignment is for.`
          : "Campus only matters for a campus-scoped role (Campus Head, Office, or a Teacher/Incharge tied to one campus) — leave it unset for an institute-wide role like Super Admin."
      }
      submitLabel="Assign"
      action={assignRole}
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`role-${userId}`}>Role</Label>
        <Select name="roleId" required onValueChange={(value) => setSelectedRoleId(value as string | null)}>
          <SelectTrigger id={`role-${userId}`} className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`campus-${userId}`}>{campusRequired ? "Campus (required)" : "Campus (optional)"}</Label>
        <Select name="campusId" required={campusRequired}>
          <SelectTrigger id={`campus-${userId}`} className="w-full">
            <SelectValue placeholder={campusRequired ? "Select a campus" : "All campuses"} />
          </SelectTrigger>
          <SelectContent>
            {campuses.map((campus) => (
              <SelectItem key={campus.id} value={campus.id}>
                {campus.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}

export function RemoveRoleButton({ userId, userRoleId, roleName }: { userId: string; userRoleId: string; roleName: string }) {
  return (
    <ConfirmActionButton
      label="Remove"
      confirmTitle={`Remove ${roleName}?`}
      confirmDescription="This immediately signs the user out of every active session. They keep their login, just without this role until it's reassigned."
      destructive
      action={() => removeRole(userId, userRoleId)}
    />
  );
}

export function ToggleActiveButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  return (
    <ConfirmActionButton
      label={isActive ? "Disable" : "Enable"}
      confirmTitle={isActive ? "Disable this user?" : "Enable this user?"}
      confirmDescription={
        isActive
          ? "They're immediately signed out of every active session and can't log back in until re-enabled."
          : "They'll be able to log in again."
      }
      destructive={isActive}
      action={() => setUserActive(userId, !isActive)}
    />
  );
}
