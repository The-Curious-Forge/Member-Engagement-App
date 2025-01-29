const express = require("express");
const router = express.Router();
const { getMessages } = require("./airtableService");

// GET /notifications
router.get("/notifications", async (req, res) => {
  try {
    // Get all messages
    const allMessages = await getMessages();
    // Filter for app-wide notifications
    const appNotifications = allMessages.filter(
      (message) => message.appNotification
    );
    // Map messages to the correct format
    const messages = appNotifications.map((message) => ({
      id: message.id,
      message: message.message,
      messageDate: message.messageDate,
      important: message.important,
      appNotification: true,
    }));
    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

module.exports = router;
