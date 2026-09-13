export type InstituteType = "SCHOOL" | "ACADEMY" | "COACHING_CENTER" | "INSTITUTE";

export interface InstituteProfile {
  id: string;
  name: string;
  type: InstituteType;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface InstituteSettings {
  timezone: string;
  locale: string;
  currency: string;
}

// Institute is a true singleton — one row, no create/delete, only edit.
export const mockInstitute: InstituteProfile = {
  id: "inst_1",
  name: "Rise Campus Group of Schools",
  type: "SCHOOL",
  address: "14-C Gulberg III, Lahore",
  phone: "+92 42 3571 2200",
  email: "info@risecampus.edu",
  website: "https://risecampus.edu",
};

export const mockInstituteSettings: InstituteSettings = {
  timezone: "Asia/Karachi",
  locale: "en-PK",
  currency: "PKR",
};
