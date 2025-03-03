const express = require("express");
const router = express.Router();
const calendarService = require("../services/calendarService");

router.get("/events", async (req, res) => {
  try {
    const events = await calendarService.getEvents();
    res.json({ events });
  } catch (error) {
    console.error("Calendar route error:", error);
    res.status(500).json({
      error: "Failed to fetch calendar events",
      details: error.message,
    });
  }
});

module.exports = router;
