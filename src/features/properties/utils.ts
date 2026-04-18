import type { PropertyStatus, PropertyType, OperationType } from "./types";

export function formatPrice(amount: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount)}`;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Departamento",
  house: "Casa",
  ph: "PH",
  land: "Terreno",
  commercial: "Local",
  office: "Oficina"
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  sale: "Venta",
  rent: "Alquiler",
  temporary_rent: "Temp."
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: "Borrador",
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
  rented: "Alquilado",
  cancelled: "Cancelado"
};

export const STATUS_CLASSES: Record<PropertyStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  available: "bg-green-100 text-green-700",
  reserved: "bg-amber-100 text-amber-700",
  sold: "bg-blue-100 text-blue-700",
  rented: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700"
};
