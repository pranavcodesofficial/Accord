const express = require("express");
const router = express.Router();

const validateDecision = require("../middleware/validateDecision");

// CREATE a decision
router.post("/", validateDecision, async (req, res) => {
  try {
    const { title, description, source } = req.body;

    const decision = {
      id: Date.now(), // placeholder, replace with DB id later
      title,
      description: description || null,
      source: source || "manual",
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      decision
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET all decisions (mock for now)
router.get("/", async (req, res) => {
  return res.json({
    success: true,
    decisions: []
  });
});

module.exports = router;
