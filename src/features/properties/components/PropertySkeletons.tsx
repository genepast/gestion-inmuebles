function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between gap-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-5 bg-slate-200 rounded-full w-16" />
        </div>
        <div className="h-5 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 bg-slate-200 rounded w-12" />
          <div className="h-3 bg-slate-200 rounded w-12" />
          <div className="h-3 bg-slate-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function PropertiesGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 bg-slate-200 rounded-full w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-200 rounded w-24 ml-auto" />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="h-4 bg-slate-200 rounded w-8 mx-auto" />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="h-4 bg-slate-200 rounded w-16 ml-auto" />
      </td>
    </tr>
  );
}

export function PropertiesTableSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Propiedad</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700 hidden md:table-cell">
              Tipo / Op.
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Estado</th>
            <th className="text-right px-4 py-3 font-medium text-slate-700">Precio</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700 hidden lg:table-cell">
              Ubicación
            </th>
            <th className="text-center px-4 py-3 font-medium text-slate-700 hidden md:table-cell">
              Amb.
            </th>
            <th className="text-right px-4 py-3 font-medium text-slate-700 hidden lg:table-cell">
              Superficie
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
