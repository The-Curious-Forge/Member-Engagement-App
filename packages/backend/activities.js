const express = require("express");
const router = express.Router();
const { getActivities } = require("./airtableService");

router.get("/", async (req, res, next) => {
  try {
    const activities = await getActivities();
    res.json({
      activities: activities.map((activity) => ({
        id: activity.id,
        name: activity.activity,
      })),
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Unable to fetch activities" });
  }
});

module.exports = router;
