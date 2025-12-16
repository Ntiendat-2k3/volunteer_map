const { asyncHandler } = require("../middlewares/asyncHandler");
const { ok, created } = require("../utils/response");
const { ApiError } = require("../utils/apiError");
const postService = require("../services/post.service");
const supportCommitService = require("../services/supportCommit.service");

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

  if (post.approvalStatus !== "APPROVED") {
    if (!req.user) throw ApiError.unauthorized("Unauthorized");
    const isOwner = Number(post.userId) === Number(req.user.id);
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) throw ApiError.forbidden("Forbidden");
  }

  const showContact = !!req.user;

  const supportSummary = await supportCommitService.getSummary({
    postId: post.id,
  });

  return ok(res, {
    post: {
      ...postService.sanitizePost(post, { showContact }),
      supportSummary,
    },
  });
});

const update = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.post, req.body);

  const contentKeys = [
    "title",
    "description",
    "address",
    "lat",
    "lng",
    "needTags",
    "contactName",
    "contactPhone",
  ];
  const contentChanged = contentKeys.some((k) => req.body?.[k] !== undefined);

  const message = contentChanged
    ? "Đã cập nhật. Bài quay về trạng thái chờ duyệt."
    : req.body?.status !== undefined
    ? "Đã cập nhật trạng thái bài."
    : "Đã cập nhật.";

  return ok(res, { post, message });
});

const remove = asyncHandler(async (req, res) => {
  await postService.deletePost(req.post);
  return ok(res, { message: "Deleted" });
});

module.exports = { create, list, mine, getById, update, remove };
