import apiClient from "@/lib/api-client";
import type { Supplier } from "@/types/order";

export const supplierService = {
  getAll: () => apiClient.get<Supplier[]>("/api/suppliers"),

  getById: (id: string) => apiClient.get<Supplier>(`/api/suppliers/${id}`),

  create: (payload: Omit<Supplier, "id">) =>
    apiClient.post<Supplier>("/api/suppliers", payload),

  update: (id: string, payload: Partial<Supplier>) =>
    apiClient.put<Supplier>(`/api/suppliers/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/suppliers/${id}`),
};
