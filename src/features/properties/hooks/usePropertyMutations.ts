"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PropertyFormValues } from "../schemas/property.schema";
import type { PropertiesPageResponse, PropertyListItem } from "../types";

async function apiCreateProperty(values: PropertyFormValues): Promise<{ id: string }> {
  const res = await fetch("/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });
  if (!res.ok) {
    const err: { error?: string } = await (res.json() as Promise<{ error?: string }>).catch(() => ({}));
    throw new Error(err.error ?? "Error al crear propiedad");
  }
  return res.json() as Promise<{ id: string }>;
}

async function apiUpdateProperty(
  id: string,
  values: PropertyFormValues
): Promise<PropertyListItem> {
  const res = await fetch(`/api/properties/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });
  if (!res.ok) {
    const err: { error?: string } = await (res.json() as Promise<{ error?: string }>).catch(() => ({}));
    throw new Error(err.error ?? "Error al actualizar propiedad");
  }
  return res.json() as Promise<PropertyListItem>;
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCreateProperty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["properties"] });
    }
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PropertyFormValues }) =>
      apiUpdateProperty(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: ["properties"] });

      const snapshots = queryClient.getQueriesData<PropertiesPageResponse>({
        queryKey: ["properties"]
      });

      queryClient.setQueriesData<PropertiesPageResponse>(
        { queryKey: ["properties"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((p) =>
              p.id === id
                ? {
                    ...p,
                    title: values.title,
                    property_type: values.property_type,
                    operation_type: values.operation_type,
                    status: values.status,
                    price_amount: values.price_amount,
                    price_currency: values.price_currency,
                    city: values.city ?? p.city,
                    province: values.province ?? p.province,
                    bedrooms: values.bedrooms,
                    bathrooms: values.bathrooms,
                    total_area_m2: values.total_area_m2 ?? p.total_area_m2
                  }
                : p
            )
          };
        }
      );

      return { snapshots };
    },
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["properties"] });
    }
  });
}
