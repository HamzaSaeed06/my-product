"use client";

import { createContext, useContext, useState } from "react";
import { PORTAL_DEMO, type PortalRole } from "@/lib/mock/portal-session";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockParents } from "@/lib/mock/parents";
import { getStudentById } from "@/lib/mock/students";

interface PortalContextValue {
  role: PortalRole;
  setRole: (role: PortalRole) => void;
  activeChildId: string;
  setActiveChildId: (id: string) => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

// Phase B fixes one demo identity per role rather than wiring real session
// switching (the real backend gates the portal by raw role membership, a
// completely separate path from the admin dashboard's permission system).
// This switcher is a review-time-only aid, same spirit as the design-
// system switcher — not meant to ship.
export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<PortalRole>("PARENT");
  const [activeChildId, setActiveChildId] = useState(PORTAL_DEMO.studentId);

  return <PortalContext.Provider value={{ role, setRole, activeChildId, setActiveChildId }}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}

// Shared by PortalSidebar (NavUser) and PortalHeader so the "who is
// signed in" name/subtitle logic exists in exactly one place.
export function usePortalIdentity() {
  const { role } = usePortal();
  const parent = mockParents.find((p) => p.id === PORTAL_DEMO.parentId);

  if (role === "TEACHER") {
    const teacher = mockAppUsers.find((u) => u.id === PORTAL_DEMO.teacherUserId);
    return { name: teacher?.fullName ?? "", subtitle: teacher?.email };
  }
  if (role === "PARENT") {
    return { name: parent?.fullName ?? "", subtitle: parent?.email ?? undefined };
  }
  const student = getStudentById(PORTAL_DEMO.studentId);
  return { name: student?.fullName ?? "", subtitle: student?.admissionNo };
}
