import {
  User,
  Mail,
  HeartPulse,
  Bus,
  Home,
  GraduationCap,
  Shield,
  Info,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIconKey } from "@/lib/mock/student-fields";

export const CATEGORY_ICONS: Record<CategoryIconKey, LucideIcon> = {
  user: User,
  mail: Mail,
  "heart-pulse": HeartPulse,
  bus: Bus,
  home: Home,
  "graduation-cap": GraduationCap,
  shield: Shield,
  info: Info,
};

export const CATEGORY_ICON_OPTIONS: { value: CategoryIconKey; label: string }[] = [
  { value: "user", label: "Person" },
  { value: "mail", label: "Contact" },
  { value: "heart-pulse", label: "Health" },
  { value: "bus", label: "Transport" },
  { value: "home", label: "Address" },
  { value: "graduation-cap", label: "Academic" },
  { value: "shield", label: "Identity" },
  { value: "info", label: "General" },
];

export function CategoryIcon({ icon, className }: { icon: CategoryIconKey; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? Info;
  return <Icon className={className} />;
}
