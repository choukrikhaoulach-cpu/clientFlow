import apiClient from "./client";

export const listInvoices = (params) => apiClient.get("/invoices", { params }).then((r) => r.data.invoices);
export const getInvoice = (id) => apiClient.get(`/invoices/${id}`).then((r) => r.data.invoice);
export const createInvoice = (payload) => apiClient.post("/invoices", payload).then((r) => r.data.invoice);
export const updateInvoice = (id, payload) => apiClient.patch(`/invoices/${id}`, payload).then((r) => r.data.invoice);
export const deleteInvoice = (id) => apiClient.delete(`/invoices/${id}`).then((r) => r.data);
