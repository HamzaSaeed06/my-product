import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  // Layout above already redirects to /login if unauthenticated, so this
  // is always non-null here — re-reading is free thanks to React's cache().
  const user = await getCurrentUser();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-foreground">Welcome, {user!.fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user!.email}</p>
      </div>
    </div>
  );
}
