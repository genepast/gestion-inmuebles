export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="text-sm font-medium">Gestión de Inmuebles</div>
          <div className="text-xs text-slate-500">Dashboard</div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}

