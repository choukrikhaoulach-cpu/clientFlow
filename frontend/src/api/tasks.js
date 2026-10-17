import apiClient from "./client";

export const listTasks = (params) => apiClient.get("/tasks", { params }).then((r) => r.data.tasks);
export const createTask = (payload) => apiClient.post("/tasks", payload).then((r) => r.data.task);
export const updateTask = (id, payload) => apiClient.patch(`/tasks/${id}`, payload).then((r) => r.data.task);
export const deleteTask = (id) => apiClient.delete(`/tasks/${id}`).then((r) => r.data);
