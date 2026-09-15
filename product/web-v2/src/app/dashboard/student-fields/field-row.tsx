"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Lock, LockOpen, Pencil, Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/icon-action-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { FieldDefinition, FieldType } from "@/lib/mock/student-fields";

const TYPE_LABEL: Record<FieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  DATE: "Date",
  DROPDOWN: "Dropdown",
  YES_NO: "Yes / No",
};

export function FieldRow({
  field,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleLock,
  onEdit,
  onDelete,
}: {
  field: FieldDefinition;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleLock: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-[var(--card-radius)] border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{field.label}</span>
          <span className="text-xs text-muted-foreground">
            {TYPE_LABEL[field.type]}
            {field.required ? " · Required" : ""}
          </span>
        </div>
        <IconActionButton
          label={field.locked ? "Locked institute-wide — click to unlock" : "Campus-editable — click to lock"}
          onClick={() => {
            onToggleLock();
            toast.success(field.locked ? `"${field.label}" unlocked for campuses.` : `"${field.label}" locked institute-wide.`);
          }}
          className={field.locked ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}
        >
          {field.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
        </IconActionButton>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <IconActionButton label="Move up" onClick={onMoveUp} disabled={!canMoveUp}>
          <ArrowUp className="size-3.5" />
        </IconActionButton>
        <IconActionButton label="Move down" onClick={onMoveDown} disabled={!canMoveDown}>
          <ArrowDown className="size-3.5" />
        </IconActionButton>
        <IconActionButton label="Edit field" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </IconActionButton>
        <IconActionButton label="Delete field" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="size-3.5" />
        </IconActionButton>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete field?"
        description={`"${field.label}" will be removed from the student form. Values already collected for existing students are kept, not deleted.`}
        confirmLabel="Delete field"
        successMessage={`"${field.label}" deleted.`}
        onConfirm={onDelete}
      />
    </div>
  );
}
