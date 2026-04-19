import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PropertyForm } from "@/features/properties/components/PropertyForm";

export default async function PropertyNewPage() {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  let isAdmin = false;
  let agents: { id: string; full_name: string | null }[] = [];

  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    isAdmin = profile?.role === "admin";

    if (isAdmin) {
      const adminClient = createSupabaseAdminClient();
      const { data } = await adminClient
        .from("profiles")
        .select("id, full_name")
        .eq("role", "agent");
      agents = data ?? [];
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Nueva propiedad</h1>
        <p className="mt-1 text-sm text-slate-500">Completá los datos para publicar la propiedad.</p>
      </div>
      <PropertyForm isAdmin={isAdmin} agents={agents} />
    </section>
  );
}
