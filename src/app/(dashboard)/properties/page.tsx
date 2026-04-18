import { Suspense } from "react";
import { PropertiesClient } from "@/features/properties/components/PropertiesClient";
import { PropertiesGridSkeleton } from "@/features/properties/components/PropertySkeletons";

export default function PropertiesListPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          <PropertiesGridSkeleton />
        </div>
      }
    >
      <PropertiesClient />
    </Suspense>
  );
}
