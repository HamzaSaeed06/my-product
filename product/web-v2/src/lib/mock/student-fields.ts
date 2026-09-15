// Backs the "custom student fields" design agreed with the user: a small
// set of core fields ship built into the product (name, DOB, guardian,
// etc. — modeled directly on the real Student table, not here), and
// everything else is Institute-defined on top of that, organized into
// categories, with a per-field lock that decides whether a Campus can
// extend/reorder it or whether it's fixed institute-wide. This file is
// the mock stand-in for that schema until Phase C designs the real
// storage (likely a field-definitions table + a JSON value column,
// discussed but deliberately not decided here — mock first, see
// PROGRESS.md).

export type FieldType = "TEXT" | "NUMBER" | "DATE" | "DROPDOWN" | "YES_NO";

export interface FieldCategory {
  id: string;
  name: string;
  order: number;
}

export interface FieldDefinition {
  id: string;
  categoryId: string;
  label: string;
  type: FieldType;
  required: boolean;
  // Locked = every campus sees this exact field, cannot edit or remove it.
  // Unlocked = the Institute still defines it here as the default, but a
  // Campus Head is allowed to hide it or reorder it for their own campus
  // (see mockCampusFieldOverrides below) — never edit its definition.
  locked: boolean;
  options?: string[]; // DROPDOWN only
  order: number;
}

export const mockFieldCategories: FieldCategory[] = [
  { id: "cat_personal", name: "Personal Info", order: 0 },
  { id: "cat_health", name: "Health", order: 1 },
  { id: "cat_transport", name: "Transport", order: 2 },
];

export const mockFieldDefinitions: FieldDefinition[] = [
  { id: "fld_blood_group", categoryId: "cat_health", label: "Blood Group", type: "DROPDOWN", required: false, locked: false, options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], order: 0 },
  { id: "fld_allergies", categoryId: "cat_health", label: "Known Allergies", type: "TEXT", required: false, locked: false, order: 1 },
  { id: "fld_religion", categoryId: "cat_personal", label: "Religion", type: "TEXT", required: false, locked: true, order: 0 },
  { id: "fld_previous_school", categoryId: "cat_personal", label: "Previous School", type: "TEXT", required: false, locked: false, order: 1 },
  { id: "fld_uses_transport", categoryId: "cat_transport", label: "Uses School Transport", type: "YES_NO", required: false, locked: true, order: 0 },
  { id: "fld_pickup_point", categoryId: "cat_transport", label: "Pickup Point", type: "TEXT", required: false, locked: false, order: 1 },
];

// A Campus opting to hide an unlocked field for its own campus — never
// present for a `locked: true` field, enforced in the builder UI, not
// just by convention here.
export interface CampusFieldOverride {
  campusId: string;
  fieldId: string;
  hidden: boolean;
}

export const mockCampusFieldOverrides: CampusFieldOverride[] = [
  { campusId: "cmp_riverside", fieldId: "fld_previous_school", hidden: true },
];

// Per-student values, keyed by field id. Only a handful of demo students
// have any — most real students would have gaps (fields added after they
// enrolled, or fields they simply weren't asked), which the display below
// treats as "not recorded," not an error.
export const mockStudentFieldValues: Record<string, Record<string, string>> = {
  stu_0191: {
    fld_blood_group: "O+",
    fld_allergies: "Peanuts",
    fld_religion: "Islam",
    fld_uses_transport: "Yes",
    fld_pickup_point: "Gulshan Block 4",
  },
  stu_0148: {
    fld_blood_group: "A+",
    fld_religion: "Islam",
    fld_uses_transport: "No",
  },
};

export function getFieldValuesForStudent(studentId: string) {
  const values = mockStudentFieldValues[studentId] ?? {};
  return mockFieldCategories
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      category,
      fields: mockFieldDefinitions
        .filter((f) => f.categoryId === category.id && values[f.id] !== undefined)
        .sort((a, b) => a.order - b.order)
        .map((field) => ({ field, value: values[field.id] })),
    }))
    .filter((group) => group.fields.length > 0);
}
