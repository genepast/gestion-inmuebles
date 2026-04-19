import { NextResponse } from "next/server";
import type { RawExternalProperty } from "@/lib/external-api/types";

const MOCK_PROPERTIES: RawExternalProperty[] = [
  {
    id: "ext-001",
    title: "Departamento luminoso en Palermo Hollywood",
    description: "Hermoso departamento de 2 ambientes con balcón y muy buena luz natural. Piso 5 con vista despejada.",
    operation: "rent",
    type: "apartment",
    price: { value: 850, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Palermo Hollywood", address: "Honduras 5600" },
    features: { beds: 2, baths: 1, total_area: 55, covered_area: 50, parking: 0, balcony: true, pool: false, garden: false },
    images: [],
    published_at: "2026-03-01T10:00:00Z"
  },
  {
    id: "ext-002",
    title: "Casa en venta con jardín en Tigre",
    description: "Amplia casa de 4 ambientes en barrio privado con acceso al río. Jardín propio y pileta.",
    operation: "sale",
    type: "house",
    price: { value: 280000, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Tigre", neighborhood: "Nordelta" },
    features: { beds: 4, baths: 3, total_area: 320, covered_area: 220, parking: 2, pool: true, garden: true, balcony: false, year: 2015 },
    images: [],
    published_at: "2026-03-05T09:00:00Z"
  },
  {
    id: "ext-003",
    title: "Oficina en microcentro con vista al río",
    description: "Oficina en piso 12 con excelente vista. Ideal para empresa de hasta 20 personas.",
    operation: "rent",
    type: "office",
    price: { value: 3200, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Microcentro", address: "Av. Corrientes 800" },
    features: { beds: 0, baths: 2, total_area: 180, covered_area: 180, parking: 1 },
    images: [],
    published_at: "2026-03-08T12:00:00Z"
  },
  {
    id: "ext-004",
    title: "PH con terraza en Villa Crespo",
    description: "PH dúplex de 3 ambientes con terraza propia de 40m². Ideal para disfrutar el exterior en el corazón de la ciudad.",
    operation: "sale",
    type: "ph",
    price: { value: 165000, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Villa Crespo" },
    features: { beds: 3, baths: 2, total_area: 110, covered_area: 70, balcony: true, garden: false, pool: false, year: 2008 },
    images: [],
    published_at: "2026-03-10T08:30:00Z"
  },
  {
    id: "ext-005",
    title: "Terreno en Mendoza apto construcción",
    description: "Terreno de 800m² en zona residencial con todos los servicios. Escritura lista.",
    operation: "sale",
    type: "land",
    price: { value: 95000, currency: "USD" },
    location: { country: "Argentina", province: "Mendoza", city: "Mendoza", neighborhood: "Chacras de Coria" },
    features: { beds: 0, baths: 0, total_area: 800 },
    images: [],
    published_at: "2026-03-12T11:00:00Z"
  },
  {
    id: "ext-006",
    title: "Departamento 1 ambiente en Recoleta",
    description: "Monoambiente ideal para inversor. Alquiler temporario permitido. Totalmente amueblado.",
    operation: "temporary_rent",
    type: "apartment",
    price: { value: 1200, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Recoleta", address: "Av. Santa Fe 2100" },
    features: { beds: 1, baths: 1, total_area: 38, covered_area: 35, balcony: false, pool: false, garden: false },
    images: [],
    published_at: "2026-03-15T14:00:00Z"
  },
  {
    id: "ext-007",
    title: "Local comercial en Córdoba centro",
    description: "Local a estrenar de 120m² en esquina con alta circulación peatonal. Apto gastronomía.",
    operation: "rent",
    type: "commercial",
    price: { value: 1500, currency: "USD" },
    location: { country: "Argentina", province: "Córdoba", city: "Córdoba", address: "Av. Vélez Sársfield 300" },
    features: { beds: 0, baths: 1, total_area: 120, covered_area: 120 },
    images: [],
    published_at: "2026-03-18T09:00:00Z"
  },
  {
    id: "ext-008",
    title: "Casa familiar en Rosario con pileta",
    description: "Casa de 5 ambientes en barrio tranquilo. Jardín con pileta, quincho y garage doble.",
    operation: "sale",
    type: "house",
    price: { value: 210000, currency: "USD" },
    location: { country: "Argentina", province: "Santa Fe", city: "Rosario", neighborhood: "Fisherton" },
    features: { beds: 5, baths: 3, total_area: 380, covered_area: 250, parking: 2, pool: true, garden: true, balcony: false, year: 2003 },
    images: [],
    published_at: "2026-03-20T10:30:00Z"
  },
  {
    id: "ext-009",
    title: "Departamento 3 ambientes en Belgrano",
    description: "Amplio departamento en edificio con amenities: sum, gym y piscina. Muy luminoso.",
    operation: "rent",
    type: "apartment",
    price: { value: 1400, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Belgrano R" },
    features: { beds: 3, baths: 2, total_area: 95, covered_area: 88, parking: 1, pool: true, balcony: true, garden: false },
    images: [],
    published_at: "2026-03-22T08:00:00Z"
  },
  {
    id: "ext-010",
    title: "Oficina boutique en San Telmo",
    description: "Espacio de trabajo creativo en edificio patrimonial renovado. Ideal estudio o coworking.",
    operation: "rent",
    type: "office",
    price: { value: 900, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "San Telmo" },
    features: { beds: 0, baths: 1, total_area: 60, covered_area: 60 },
    images: [],
    published_at: "2026-03-25T11:00:00Z"
  },
  {
    id: "ext-011",
    title: "Departamento en pozo en Saavedra",
    description: "Entrega 2027. 2 ambientes con cochera y baulera incluida. Precio de pozo.",
    operation: "sale",
    type: "apartment",
    price: { value: 118000, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Saavedra" },
    features: { beds: 2, baths: 1, total_area: 58, covered_area: 55, parking: 1, balcony: true, pool: false, garden: false },
    images: [],
    published_at: "2026-03-28T09:00:00Z"
  },
  {
    id: "ext-012",
    title: "Casa en alquiler en Bariloche",
    description: "Casa de montaña con vista al lago. Ideal para temporada de invierno o verano.",
    operation: "temporary_rent",
    type: "house",
    price: { value: 200, currency: "USD" },
    location: { country: "Argentina", province: "Río Negro", city: "Bariloche" },
    features: { beds: 4, baths: 2, total_area: 180, covered_area: 150, garden: true, pool: false, balcony: true },
    images: [],
    published_at: "2026-04-01T10:00:00Z"
  },
  {
    id: "ext-013",
    title: "Departamento premium en Puerto Madero",
    description: "Unidad de lujo en torre con amenities completos. Vistas al río Paraná de la Plata.",
    operation: "sale",
    type: "apartment",
    price: { value: 650000, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Puerto Madero" },
    features: { beds: 3, baths: 3, total_area: 200, covered_area: 190, parking: 2, pool: true, garden: false, balcony: true, year: 2020 },
    images: [],
    published_at: "2026-04-03T14:00:00Z"
  },
  {
    id: "ext-014",
    title: "Local en galería comercial en Mar del Plata",
    description: "Local en planta baja de galería céntrica con gran flujo de personas.",
    operation: "rent",
    type: "commercial",
    price: { value: 400, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Mar del Plata", address: "Peatonal San Martín 2800" },
    features: { beds: 0, baths: 1, total_area: 45, covered_area: 45 },
    images: [],
    published_at: "2026-04-05T09:30:00Z"
  },
  {
    id: "ext-015",
    title: "PH en planta baja con jardín en Caballito",
    description: "PH de 4 ambientes en planta baja con jardín propio. Muy silencioso y luminoso.",
    operation: "sale",
    type: "ph",
    price: { value: 195000, currency: "USD" },
    location: { country: "Argentina", province: "Buenos Aires", city: "Buenos Aires", neighborhood: "Caballito" },
    features: { beds: 4, baths: 2, total_area: 140, covered_area: 100, garden: true, pool: false, balcony: false, year: 1995 },
    images: [],
    published_at: "2026-04-08T10:00:00Z"
  }
];

export function GET() {
  return NextResponse.json(MOCK_PROPERTIES);
}
