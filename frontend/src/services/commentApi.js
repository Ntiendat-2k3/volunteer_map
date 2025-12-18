import { http } from "./http";

export const commentApi = {
  list: (postId, params) => http.get(`/posts/${postId}/comments`, { params }),
  create: (postId, payload) => http.post(`/posts/${postId}/comments`, payload), // {content, parentId?}
  update: (postId, commentId, payload) =>
    http.put(`/posts/${postId}/comments/${commentId}`, payload),
  remove: (postId, commentId) =>
    http.delete(`/posts/${postId}/comments/${commentId}`),
};
