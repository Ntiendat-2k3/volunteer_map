const router = require("express").Router({ mergeParams: true });

const { requireAuth } = require("../middlewares/requireAuth");
const {
  requirePostOwnerOrAdmin,
} = require("../middlewares/requirePostOwnerOrAdmin");
const ctrl = require("../controllers/supportCommit.controller");

router.get("/summary", ctrl.summary);

router.get("/mine", requireAuth, ctrl.myForPost);
router.post("/", requireAuth, ctrl.createForPost);

// owner/admin xem danh sách + xác nhận
router.get("/", requireAuth, requirePostOwnerOrAdmin, ctrl.listForPost);
router.patch(
  "/:commitId/confirm",
  requireAuth,
  requirePostOwnerOrAdmin,
  ctrl.confirm
);

// người tạo commit OR owner/admin được huỷ (service check quyền)
router.patch("/:commitId/cancel", requireAuth, ctrl.cancel);

module.exports = router;
