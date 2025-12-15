const { asyncHandler } = require("../middlewares/asyncHandler");
const { ok } = require("../utils/response");
const { ApiError } = require("../utils/apiError");
const geoService = require("../services/geo.service");

const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (q.length < 3) throw ApiError.badRequest("Query tối thiểu 3 ký tự");
  const items = await geoService.searchAddress(q);
  return ok(res, { items });
});

const reverse = asyncHandler(async (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const item = await geoService.reverseGeocode(lat, lng);
  return ok(res, { item });
});

module.exports = { search, reverse };
