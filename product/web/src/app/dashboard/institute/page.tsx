import { apiRequest } from "@/lib/apiClient";
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
  const institute = await apiRequest<InstituteResponse>("/api/v1/institute");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Institute" description="Core profile and configurable terminology." />

      <section className="mb-8 rounded-lg border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-foreground">Profile</h2>
        <InstituteProfileForm institute={institute} />
      </section>

      <section className="rounded-lg border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-foreground">Settings &amp; terminology</h2>
        <InstituteSettingsForm settings={institute.settings} />
      </section>
    </div>
  );
}
