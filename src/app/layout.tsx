import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Inmuebles",
  description: "Sistema interno de gestión de propiedades"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

