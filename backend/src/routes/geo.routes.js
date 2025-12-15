const router = require("express").Router();
const geoController = require("../controllers/geo.controller");

router.get("/search", geoController.search);
router.get("/reverse", geoController.reverse);

module.exports = router;
