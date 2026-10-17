import apiClient from "./client";

export const listPayments = (params) => apiClient.get("/payments", { params }).then((r) => r.data.payments);
export const createPayment = (payload) => apiClient.post("/payments", payload).then((r) => r.data.payment);
export const deletePayment = (id) => apiClient.delete(`/payments/${id}`).then((r) => r.data);
