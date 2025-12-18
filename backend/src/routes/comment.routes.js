const router = require("express").Router({ mergeParams: true });

const { requireAuth } = require("../middlewares/requireAuth");
const commentController = require("../controllers/comment.controller");

router.get("/", commentController.list);
router.post("/", requireAuth, commentController.create);
router.put("/:commentId", requireAuth, commentController.update);
router.delete("/:commentId", requireAuth, commentController.remove);

module.exports = router;
