"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { PropertyFilters, PropertiesPageResponse } from "../types";

async function fetchProperties(filters: PropertyFilters): Promise<PropertiesPageResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.type) params.set("type", filters.type);
  if (filters.city) params.set("city", filters.city);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);

  const response = await fetch(`/api/properties?${params.toString()}`);
  if (!response.ok) throw new Error("Error al cargar propiedades");
  return response.json() as Promise<PropertiesPageResponse>;
}

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () => fetchProperties(filters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData
  });
}

export function useDelayedLoading(isLoading: boolean, delay = 300) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLoading) {
      timer = setTimeout(() => setShow(true), delay);
    } else {
      setShow(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return show;
}
