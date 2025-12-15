const { asyncHandler } = require("../middlewares/asyncHandler");
const { ok, created } = require("../utils/response");
const { ApiError } = require("../utils/apiError");
const postService = require("../services/post.service");

const create = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user.id, req.body);
  return created(res, { post, message: "Bài đã tạo và đang chờ duyệt" });
});

const list = asyncHandler(async (req, res) => {
  const data = await postService.listPublicPosts(req.query);
  return ok(res, data);
});

const mine = asyncHandler(async (req, res) => {
  const data = await postService.listMyPosts(req.user.id);
  return ok(res, data);
});

const getById = asyncHandler(async (req, res) => {
  const post = req.post;

  // Public chỉ xem APPROVED. Nếu chưa duyệt -> phải là owner/admin mới xem được
  if (post.approvalStatus !== "APPROVED") {
    if (!req.user) throw ApiError.unauthorized("Unauthorized");
    const isOwner = Number(post.userId) === Number(req.user.id);
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) throw ApiError.forbidden("Forbidden");
  }

  const showContact = !!req.user; // ✅ chỉ login mới thấy số
  return ok(res, { post: postService.sanitizePost(post, { showContact }) });
});

const update = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.post, req.body);
  return ok(res, {
    post,
    message: "Đã cập nhật. Bài quay về trạng thái chờ duyệt.",
  });
});

const remove = asyncHandler(async (req, res) => {
  await postService.deletePost(req.post);
  return ok(res, { message: "Deleted" });
});

module.exports = { create, list, mine, getById, update, remove };
