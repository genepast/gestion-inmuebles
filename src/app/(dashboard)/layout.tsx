import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { NavLinks } from "@/components/layout/NavLinks";
import { SyncTrigger } from "@/components/layout/SyncTrigger";

export default async function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let role = "viewer";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "admin" || profile?.role === "agent") {
      role = profile.role;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 h-14 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-4">
          <span className="text-sm font-semibold text-slate-900">Gestión de Inmuebles</span>
          <div className="flex items-center gap-4">
            {user && <span className="hidden text-xs text-slate-500 sm:block">{user.email}</span>}
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden border-b border-slate-200 bg-white px-2 py-1 overflow-x-auto">
        <NavLinks orientation="horizontal" />
      </nav>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-slate-200 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          <NavLinks orientation="vertical" />
          {role === "admin" && (
            <div className="mt-auto pt-3 border-t border-slate-100">
              <SyncTrigger />
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-6">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
