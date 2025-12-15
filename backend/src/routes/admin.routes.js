const router = require("express").Router();
const { requireAuth } = require("../middlewares/requireAuth");
const { requireRole } = require("../middlewares/requireRole");
const adminController = require("../controllers/admin.controller");

router.get(
  "/dashboard",
  requireAuth,
  requireRole("ADMIN"),
  adminController.dashboard
);
router.get(
  "/posts",
  requireAuth,
  requireRole("ADMIN"),
  adminController.listPosts
);
router.patch(
  "/posts/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  adminController.approve
);
router.patch(
  "/posts/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
  adminController.reject
);

module.exports = router;
