const express = require("express");
const router = express.Router();
const { getAllMessages } = require("../services/messagesService");

router.get("/notifications", async (req, res, next) => {
  try {
    const allMessages = await getAllMessages();
    const appNotifications = allMessages.filter(
      (message) => message.appNotification
    );
    const messages = appNotifications.map((message) => ({
      id: message.id,
      message: message.message,
      messageDate: message.messageDate,
      important: message.important,
      appNotification: true,
    }));
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
