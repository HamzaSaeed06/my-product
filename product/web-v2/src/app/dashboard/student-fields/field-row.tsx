"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Lock, LockOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
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
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">{field.label}</span>
        <span className="text-xs text-muted-foreground">
          {TYPE_LABEL[field.type]}
          {field.required ? " · Required" : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move up">
          <ArrowUp className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move down">
          <ArrowDown className="size-3.5" />
        </Button>
        <StatusDot tone={field.locked ? "neutral" : "success"}>
          {field.locked ? "Locked" : "Campus-editable"}
        </StatusDot>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            onToggleLock();
            toast.success(field.locked ? `"${field.label}" unlocked for campuses.` : `"${field.label}" locked institute-wide.`);
          }}
          aria-label={field.locked ? "Unlock field" : "Lock field"}
        >
          {field.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit field">
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmOpen(true)} aria-label="Delete field">
          <Trash2 className="size-3.5" />
        </Button>
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
