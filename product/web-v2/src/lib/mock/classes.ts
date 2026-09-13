export interface SchoolClass {
  id: string;
  name: string;
  sortOrder: number;
  archived: boolean;
}

// Institute-wide catalog — campus-agnostic. Only becomes a concrete,
// campus-and-year-specific offering via a Section (see sections.ts).
export const mockClasses: SchoolClass[] = [
  { id: "cls_montessori", name: "Montessori", sortOrder: 0, archived: false },
  { id: "cls_1", name: "Grade 1", sortOrder: 1, archived: false },
  { id: "cls_2", name: "Grade 2", sortOrder: 2, archived: false },
  { id: "cls_3", name: "Grade 3", sortOrder: 3, archived: false },
  { id: "cls_4", name: "Grade 4", sortOrder: 4, archived: false },
  { id: "cls_5", name: "Grade 5", sortOrder: 5, archived: false },
  { id: "cls_6", name: "Grade 6", sortOrder: 6, archived: false },
  { id: "cls_7", name: "Grade 7", sortOrder: 7, archived: false },
  { id: "cls_8", name: "Grade 8", sortOrder: 8, archived: false },
  { id: "cls_o_level", name: "O Level (Legacy)", sortOrder: 9, archived: true },
];
