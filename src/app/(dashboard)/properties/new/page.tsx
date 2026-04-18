import { PropertyForm } from "@/features/properties/components/PropertyForm";

export default function PropertyNewPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Nueva propiedad</h1>
        <p className="mt-1 text-sm text-slate-500">Completá los datos para publicar la propiedad.</p>
      </div>
      <PropertyForm />
    </section>
  );
}
