const router = require("express").Router();
const { requireAuth } = require("../middlewares/requireAuth");
const { optionalAuth } = require("../middlewares/optionalAuth");
const { loadPost } = require("../middlewares/loadPost");
const {
  requirePostOwnerOrAdmin,
} = require("../middlewares/requirePostOwnerOrAdmin");
const postController = require("../controllers/post.controller");
const supportCommitRoutes = require("./supportCommit.routes");
const commentRoutes = require("./comment.routes");

// Public list (chỉ APPROVED)
router.get("/", postController.list);

// My posts (all statuses)
router.get("/mine", requireAuth, postController.mine);

router.use("/:id/comments", optionalAuth, loadPost, commentRoutes);

// ✅ Support commits nested
router.use("/:id/support-commits", loadPost, supportCommitRoutes);

// Detail: optional auth để owner xem bài PENDING
router.get("/:id", optionalAuth, loadPost, postController.getById);

// Create
router.post("/", requireAuth, postController.create);

// Update/Delete: owner/admin
router.put(
  "/:id",
  requireAuth,
  loadPost,
  requirePostOwnerOrAdmin,
  postController.update
);
router.delete(
  "/:id",
  requireAuth,
  loadPost,
  requirePostOwnerOrAdmin,
  postController.remove
);

module.exports = router;
