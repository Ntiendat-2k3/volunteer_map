import { http } from "./http";

export const adminApi = {
  dashboard: () => http.get("/admin/dashboard"),
  listPosts: (params) => http.get("/admin/posts", { params }),
  approve: (id) => http.patch(`/admin/posts/${id}/approve`),
  reject: (id, reason) => http.patch(`/admin/posts/${id}/reject`, { reason }),
};
