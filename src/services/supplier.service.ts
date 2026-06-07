export const supplierService = {
  getAll: async () => {
    const response = await fetch("/api/suppliers");

    if (!response.ok) {
      throw new Error("Failed to load suppliers");
    }

    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`/api/suppliers/${id}`);

    if (!response.ok) {
      throw new Error("Failed to load supplier");
    }

    return response.json();
  },

  create: async (payload: any) => {
    const response = await fetch("/api/suppliers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create supplier");
    }

    return response.json();
  },
};
