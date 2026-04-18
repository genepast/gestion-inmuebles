import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/features/properties/components/PropertyForm";

interface Props {
  params: { id: string };
}

export default async function PropertyEditPage({ params }: Props) {
  const supabase = createSupabaseServerClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("id", params.id)
    .single();

  if (error || !property) notFound();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Editar propiedad</h1>
        <p className="mt-1 text-sm text-slate-500 line-clamp-1">{property.title}</p>
      </div>
      <PropertyForm property={property} />
    </section>
  );
}
