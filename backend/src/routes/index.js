const router = require("express").Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.use("/auth", require("./auth.routes"));
router.use("/posts", require("./post.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/geo", require("./geo.routes"));

module.exports = router;
