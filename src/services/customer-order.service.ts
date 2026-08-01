import apiClient from "@/lib/api-client";
import type { CustomerOrder } from "@/types/customer-order";

export type GetCustomerOrdersResponse = {
  orders: CustomerOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export const customerOrderService = {
  getAll: (params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    designId?: string;
    color?: string;
    size?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.categoryId) queryParams.append("categoryId", params.categoryId);
    if (params.designId) queryParams.append("designId", params.designId);
    if (params.color) queryParams.append("color", params.color);
    if (params.size) queryParams.append("size", params.size);

    return apiClient.get<GetCustomerOrdersResponse>(
      `/api/customer-orders?${queryParams.toString()}`
    );
  },

  create: (payload: Omit<CustomerOrder, "id" | "createdAt" | "totalAmount" | "status">) =>
    apiClient.post<CustomerOrder>("/api/customer-orders", payload),

  updateStatus: (id: string, status: CustomerOrder["status"]) =>
    apiClient.put<CustomerOrder>(`/api/customer-orders/${id}`, { status }),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/customer-orders/${id}`),
};
