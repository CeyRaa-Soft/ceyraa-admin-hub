import axios from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically route /api/... to /api/admin/...
instance.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith("/api/")) {
      config.url = config.url.replace(/^\/api\//, "/api/admin/");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    const customError = new Error(message) as any;
    customError.details = error.response?.data?.details || null;
    customError.status = error.response?.status || null;
    return Promise.reject(customError);
  }
);

const apiClient = {
  get: <T = any>(url: string, config?: any): Promise<T> => instance.get(url, config) as any,
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> => instance.post(url, data, config) as any,
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> => instance.put(url, data, config) as any,
  delete: <T = any>(url: string, config?: any): Promise<T> => instance.delete(url, config) as any,
};

export default apiClient;
