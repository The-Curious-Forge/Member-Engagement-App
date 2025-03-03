const express = require("express");
const router = express.Router();
const { getAppNotifications } = require("../services/messagesService");

// Get all app-wide notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await getAppNotifications();
    res.json({ alerts: notifications });
  } catch (error) {
    console.error("Error fetching app notifications:", error);
    res.status(500).json({ error: "Failed to fetch app notifications" });
  }
});

module.exports = router;
