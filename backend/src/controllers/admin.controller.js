const { asyncHandler } = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const adminService = require("../services/admin.service");

const dashboard = asyncHandler(async (_req, res) => {
  const data = await adminService.dashboard();
  return ok(res, data);
});

const listPosts = asyncHandler(async (req, res) => {
  const data = await adminService.listPosts(req.query);
  return ok(res, data);
});

const approve = asyncHandler(async (req, res) => {
  const post = await adminService.approvePost(
    Number(req.params.id),
    req.user.id
  );
  return ok(res, { post, message: "Đã duyệt bài ✅" });
});

const reject = asyncHandler(async (req, res) => {
  const post = await adminService.rejectPost(
    Number(req.params.id),
    req.user.id,
    req.body?.reason
  );
  return ok(res, { post, message: "Đã từ chối bài ❌" });
});

module.exports = { dashboard, listPosts, approve, reject };
