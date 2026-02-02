module.exports = function validateDecision(req, res, next) {
  if (!req.body || !req.body.title) {
    return res.status(400).json({ error: "Invalid decision data" });
  }
  next();
};
