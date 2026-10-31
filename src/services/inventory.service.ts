import apiClient from "@/lib/api-client";
import type { DressCategory, Design, DesignImage } from "@/types/inventory";

export const inventoryService = {
  // Categories
  getAllCategories: (wardrobeType?: string) =>
    apiClient.get<DressCategory[]>(
      wardrobeType ? `/api/dress-categories?wardrobeType=${encodeURIComponent(wardrobeType)}` : "/api/dress-categories"
    ),

  getCategoryById: (id: string) =>
    apiClient.get<DressCategory>(`/api/dress-categories/${id}`),

  createCategory: (payload: { name: string; prefix?: string; wardrobeType?: "Queen's Wardrobe" | "King's Wardrobe" }) =>
    apiClient.post<DressCategory>("/api/dress-categories", payload),

  updateCategory: (id: string, payload: Partial<DressCategory>) =>
    apiClient.put<DressCategory>(`/api/dress-categories/${id}`, payload),

  deleteCategory: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/dress-categories/${id}`),

  // Designs
  getDesigns: (categoryId?: string) => {
    const url = categoryId ? `/api/designs?categoryId=${categoryId}` : "/api/designs";
    return apiClient.get<Design[]>(url);
  },

  getDesignById: (id: string) =>
    apiClient.get<Design>(`/api/designs/${id}`),

  createDesign: (payload: Omit<Design, "id" | "code"> & { id?: string; code?: string }) =>
    apiClient.post<Design>("/api/designs", payload),

  updateDesign: (id: string, payload: Partial<Design>) =>
    apiClient.put<Design>(`/api/designs/${id}`, payload),

  deleteDesign: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/designs/${id}`),

  // Custom Collections
  getAllCollections: () =>
    apiClient.get<import("@/types/inventory").Collection[]>("/api/collections"),

  getCollectionById: (id: string) =>
    apiClient.get<import("@/types/inventory").Collection>(`/api/collections/${id}`),

  createCollection: (payload: { name: string; description?: string; imageUrl?: string }) =>
    apiClient.post<import("@/types/inventory").Collection>("/api/collections", payload),

  updateCollection: (id: string, payload: Partial<import("@/types/inventory").Collection>) =>
    apiClient.put<import("@/types/inventory").Collection>(`/api/collections/${id}`, payload),

  deleteCollection: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/collections/${id}`),

  // Image Upload
  uploadImage: async (
    file: File,
    designCode?: string,
    color?: string,
    folder?: string,
    orderId?: string
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const queryParams = new URLSearchParams();
    if (designCode) queryParams.append("designCode", designCode);
    if (color) queryParams.append("color", color);
    if (folder) queryParams.append("folder", folder);
    if (orderId) queryParams.append("orderId", orderId);

    const response = await apiClient.post<{ url: string; publicId: string }>(
      `/api/upload?${queryParams.toString()}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response;
  },

  // Confirm Order and Add to Inventory
  addToInventory: (orderId: string, mappings: any[]) =>
    apiClient.post<{ success: boolean }>(`/api/supplier-orders/${orderId}/add-to-inventory`, { mappings }),
};

