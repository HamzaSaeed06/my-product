import { PageHeader } from "@/components/page-header";
import { mockFieldCategories, mockFieldDefinitions } from "@/lib/mock/student-fields";
import { StudentFieldsBuilder } from "./student-fields-builder";

// The institute-level half of the design agreed with the user: a Super
// Admin defines categories + fields here, locking the ones every campus
// must keep as-is. The campus-level half (a Campus Head hiding/reordering
// an unlocked field for their own campus) is the next piece to build —
// this page is the source those overrides point back to.
export default function StudentFieldsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Fields"
        description="Define what information is collected about a student beyond the built-in core fields (name, DOB, guardian, etc.). Lock a field to keep it fixed institute-wide, or leave it unlocked so a campus can hide or reorder it for itself."
      />
      <StudentFieldsBuilder initialCategories={mockFieldCategories} initialFields={mockFieldDefinitions} />
    </div>
  );
}
