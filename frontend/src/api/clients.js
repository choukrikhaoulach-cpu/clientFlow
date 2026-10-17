import apiClient from "./client";

export const listClients = (params) => apiClient.get("/clients", { params }).then((r) => r.data.clients);
export const getClient = (id) => apiClient.get(`/clients/${id}`).then((r) => r.data.client);
export const createClient = (payload) => apiClient.post("/clients", payload).then((r) => r.data.client);
export const updateClient = (id, payload) => apiClient.patch(`/clients/${id}`, payload).then((r) => r.data.client);
export const deleteClient = (id) => apiClient.delete(`/clients/${id}`).then((r) => r.data);
