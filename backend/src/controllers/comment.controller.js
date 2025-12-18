const { asyncHandler } = require("../middlewares/asyncHandler");
const { ok, created } = require("../utils/response");
const { ApiError } = require("../utils/apiError");
const commentService = require("../services/comment.service");

function ensurePostReadable(req) {
  const post = req.post;
  if (post.approvalStatus === "APPROVED") return;

  if (!req.user) throw ApiError.unauthorized("Unauthorized");
  const isOwner = Number(post.userId) === Number(req.user.id);
  const isAdmin = req.user.role === "ADMIN";
  if (!isOwner && !isAdmin) throw ApiError.forbidden("Forbidden");
}

const list = asyncHandler(async (req, res) => {
  ensurePostReadable(req);
  const data = await commentService.listByPost(Number(req.post.id), req.query);
  return ok(res, data);
});

const create = asyncHandler(async (req, res) => {
  ensurePostReadable(req);

  if (req.post.approvalStatus !== "APPROVED") {
    throw ApiError.badRequest("Bài chưa được duyệt nên chưa thể bình luận");
  }

  const c = await commentService.create({
    postId: Number(req.post.id),
    userId: req.user.id,
    content: req.body?.content,
    parentId: req.body?.parentId,
  });
  return created(res, { comment: c });
});

const update = asyncHandler(async (req, res) => {
  ensurePostReadable(req);

  const c = await commentService.update({
    postId: Number(req.post.id),
    commentId: req.params.commentId,
    user: req.user,
    content: req.body?.content,
  });
  return ok(res, { comment: c });
});

const remove = asyncHandler(async (req, res) => {
  ensurePostReadable(req);

  const data = await commentService.softDelete({
    postId: Number(req.post.id),
    commentId: req.params.commentId,
    user: req.user,
  });
  return ok(res, data);
});

module.exports = { list, create, update, remove };
