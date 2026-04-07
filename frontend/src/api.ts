import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
const api = axios.create({ baseURL: BASE });

export const auth = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post("/auth/register", { name, email, password }),
  demo: () => api.post("/auth/demo", {}),
};

export const plants = {
  getAll: (params?: any) => api.get("/plants", { params }),
  getOne: (id: number) => api.get(`/plants/${id}`),
  getCompanions: (ids: number[]) =>
    api.get(`/plants/companions/${ids.join(",")}`),
};

export const gardens = {
  getByUser: (userId: number) => api.get(`/gardens/user/${userId}`),
  create: (data: any) => api.post("/gardens", data),
  getOne: (id: number) => api.get(`/gardens/${id}`),
  savePlants: (gardenId: number, plantIds: number[]) =>
    api.post(`/gardens/${gardenId}/plants`, { plant_ids: plantIds }),
  saveLayout: (gardenId: number, layout: any[]) =>
    api.put(`/gardens/${gardenId}/layout`, { layout }),
};

export const zone = {
  detect: (data: any) => api.post("/zone/detect", data),
};

export const hardscape = {
  getAll: () => api.get("/hardscape"),
};

export const ai = {
  recommendations: (data: any) => api.post("/ai/recommendations", data),
};

export default api;
