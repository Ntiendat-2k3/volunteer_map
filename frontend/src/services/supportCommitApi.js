import { http } from "./http";

export const supportCommitApi = {
  summary: (postId) => http.get(`/posts/${postId}/support-commits/summary`),
  my: (postId) => http.get(`/posts/${postId}/support-commits/mine`),

  createOrUpdate: (postId, payload) =>
    http.post(`/posts/${postId}/support-commits`, payload),

  // owner/admin
  list: (postId, params) =>
    http.get(`/posts/${postId}/support-commits`, { params }),

  confirm: (postId, commitId) =>
    http.patch(`/posts/${postId}/support-commits/${commitId}/confirm`),

  cancel: (postId, commitId) =>
    http.patch(`/posts/${postId}/support-commits/${commitId}/cancel`),

  publicList: (postId, limit) =>
    http.get(
      `/posts/${postId}/support-commits/public${limit ? `?limit=${limit}` : ""}`
    ),
};
