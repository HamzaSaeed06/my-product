import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { InstituteProfileForm, InstituteSettingsForm } from "./institute-forms";

interface InstituteResponse {
  id: string;
  name: string;
  type: "SCHOOL" | "ACADEMY" | "COACHING_CENTER" | "INSTITUTE";
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  settings: {
    timezone: string;
    locale: string;
    currency: string;
    studentLabel: string;
    teacherLabel: string;
    classLabel: string;
    sectionLabel: string;
  };
}

export default async function InstitutePage() {
  // Mirrors institute.edit/institute.configure from institute/routes.ts —
  // both forms rendered unconditionally before this, same class of bug
  // fixed across every other module. The two keys are distinct (a user can
  // hold one without the other), so each form gets its own flag.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canEdit = permissions.includes("institute.edit");
  const canConfigure = permissions.includes("institute.configure");

  const institute = await apiRequest<InstituteResponse>("/api/v1/institute");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Institute" description="Core profile and configurable terminology." />

      <section className="mb-8 rounded-lg border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-foreground">Profile</h2>
        <InstituteProfileForm institute={institute} canEdit={canEdit} />
      </section>

      <section className="rounded-lg border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-foreground">Settings &amp; terminology</h2>
        <InstituteSettingsForm settings={institute.settings} canConfigure={canConfigure} />
      </section>
    </div>
  );
}
