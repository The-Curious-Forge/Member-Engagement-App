const express = require("express");
const router = express.Router();
const { getActivities } = require("../airtableService");

// GET /activities
router.get("/", async (req, res) => {
  try {
    const activities = await getActivities();
    res.status(200).json({ activities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get activities" });
  }
});

module.exports = router;
