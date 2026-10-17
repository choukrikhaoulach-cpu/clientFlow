import apiClient from "./client";

export const listNotes = (params) => apiClient.get("/notes", { params }).then((r) => r.data.notes);
export const createNote = (payload) => apiClient.post("/notes", payload).then((r) => r.data.note);
export const updateNote = (id, payload) => apiClient.patch(`/notes/${id}`, payload).then((r) => r.data.note);
export const deleteNote = (id) => apiClient.delete(`/notes/${id}`).then((r) => r.data);
