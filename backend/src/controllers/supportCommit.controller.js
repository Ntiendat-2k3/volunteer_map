const { asyncHandler } = require("../middlewares/asyncHandler");
const { ok, created } = require("../utils/response");
const supportCommitService = require("../services/supportCommit.service");

const summary = asyncHandler(async (req, res) => {
  const postId = Number(req.post.id);
  const data = await supportCommitService.getSummary({ postId });
  return ok(res, { summary: data });
});

const myForPost = asyncHandler(async (req, res) => {
  const postId = Number(req.post.id);
  const commit = await supportCommitService.getMyCommitForPost({
    postId,
    userId: req.user.id,
  });
  return ok(res, { commit });
});

const createForPost = asyncHandler(async (req, res) => {
  const postId = Number(req.post.id);
  const commit = await supportCommitService.createOrUpdateMyCommit({
    postId,
    userId: req.user.id,
    quantity: req.body?.quantity,
    message: req.body?.message,
  });
  return created(res, { commit, message: "Đã đăng ký hỗ trợ" });
});

const listForPost = asyncHandler(async (req, res) => {
  const postId = Number(req.post.id);
  const status = req.query?.status;
  const data = await supportCommitService.listCommitsForPost({
    postId,
    status,
  });
  return ok(res, data);
});

const confirm = asyncHandler(async (req, res) => {
  const postId = Number(req.post.id);
  const commitId = Number(req.params.commitId);
  const commit = await supportCommitService.confirmCommit({ postId, commitId });
  return ok(res, { commit, message: "Đã xác nhận" });
});

const cancel = asyncHandler(async (req, res) => {
  const postId = Number(req.post.id);
  const commitId = Number(req.params.commitId);
  const commit = await supportCommitService.cancelCommit({
    postId,
    commitId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
  });
  return ok(res, { commit, message: "Đã huỷ" });
});

module.exports = {
  summary,
  myForPost,
  createForPost,
  listForPost,
  confirm,
  cancel,
};
