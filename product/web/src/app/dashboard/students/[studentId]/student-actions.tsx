"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { withdrawStudent, archiveStudentDetail, withdrawEnrollment } from "./actions";

export function WithdrawStudentButton({ studentId, name }: { studentId: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Withdraw"
      confirmTitle={`Withdraw ${name}?`}
      confirmDescription="Marks the student withdrawn and ends their current enrollment. Historical records are preserved — this can be reversed by enrolling them again (re-admission)."
      destructive
      action={() => withdrawStudent(studentId)}
    />
  );
}

export function ArchiveStudentButton({ studentId, name }: { studentId: string; name: string }) {
  return (
    <ConfirmActionButton
      label="Archive"
      confirmTitle={`Archive ${name}?`}
      confirmDescription="For erroneous or duplicate records — hides the student from normal lists without deleting anything."
      destructive
      action={() => archiveStudentDetail(studentId)}
    />
  );
}

export function WithdrawEnrollmentButton({ studentId, enrollmentId }: { studentId: string; enrollmentId: string }) {
  return (
    <ConfirmActionButton
      label="Withdraw"
      confirmTitle="Withdraw this enrollment?"
      confirmDescription="Ends this specific enrollment. The student record itself is unaffected."
      destructive
      action={() => withdrawEnrollment(studentId, enrollmentId)}
    />
  );
}
