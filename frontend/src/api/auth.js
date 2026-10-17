import apiClient from "./client";

export const registerUser = (payload) => apiClient.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) => apiClient.post("/auth/login", payload).then((r) => r.data);
export const fetchMe = () => apiClient.get("/auth/me").then((r) => r.data);
export const updateMe = (payload) => apiClient.patch("/auth/me", payload).then((r) => r.data);
