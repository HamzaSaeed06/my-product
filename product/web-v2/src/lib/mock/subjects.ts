export interface Subject {
  id: string;
  name: string;
  code: string | null;
  archived: boolean;
}

// Institute-wide catalog, no campus scoping — a shared, non-sensitive
// reference list, same as Classes.
export const mockSubjects: Subject[] = [
  { id: "sub_math", name: "Mathematics", code: "MATH", archived: false },
  { id: "sub_english", name: "English", code: "ENG", archived: false },
  { id: "sub_science", name: "Science", code: "SCI", archived: false },
  { id: "sub_urdu", name: "Urdu", code: "URD", archived: false },
  { id: "sub_islamiat", name: "Islamiat", code: "ISL", archived: false },
  { id: "sub_computer", name: "Computer Studies", code: "COMP", archived: false },
  { id: "sub_arts", name: "Arts", code: "ART", archived: true },
];
