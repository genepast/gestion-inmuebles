import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <a href="/" className="text-sm font-medium text-slate-900 hover:text-slate-600">
            Gestión de Inmuebles
          </a>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-xs text-slate-500 hidden sm:block">{user.email}</span>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
