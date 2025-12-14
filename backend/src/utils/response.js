function ok(res, data) {
  return res.status(200).json({ success: true, data });
}
function created(res, data) {
  return res.status(201).json({ success: true, data });
}
module.exports = { ok, created };
