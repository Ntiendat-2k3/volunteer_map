import { http } from "./http";

export const postApi = {
  list: (params) => http.get("/posts", { params }),
  mine: () => http.get("/posts/mine"),
  get: (id) => http.get(`/posts/${id}`),
  create: (payload) => http.post("/posts", payload),
  update: (id, payload) => http.put(`/posts/${id}`, payload),
  remove: (id) => http.delete(`/posts/${id}`),
};
