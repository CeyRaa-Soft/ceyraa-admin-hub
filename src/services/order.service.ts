import apiClient from "@/lib/api-client";
import type { Order } from "@/types/order";

export const orderService = {
  getAll: () => apiClient.get<Order[]>("/api/supplier-orders"),

  getById: (id: string) => apiClient.get<Order>(`/api/supplier-orders/${id}`),

  create: (payload: Order) =>
    apiClient.post<Order>("/api/supplier-orders", payload),

  update: (id: string, payload: Partial<Order>) =>
    apiClient.put<Order>(`/api/supplier-orders/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/supplier-orders/${id}`),
};
