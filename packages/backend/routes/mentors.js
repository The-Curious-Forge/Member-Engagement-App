const express = require("express");
const router = express.Router();
const mentorsService = require("../services/mentorsService");

// Get all mentors
router.get("/", async (req, res) => {
  try {
    const mentors = await mentorsService.getMentors();
    res.json(mentors);
  } catch (error) {
    console.error("Error in GET /mentors:", error);
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
});

// Get mentor by ID
router.get("/:id", async (req, res) => {
  try {
    const mentor = await mentorsService.getMentorById(req.params.id);
    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    res.json(mentor);
  } catch (error) {
    console.error("Error in GET /mentors/:id:", error);
    res.status(500).json({ error: "Failed to fetch mentor" });
  }
});

module.exports = router;
