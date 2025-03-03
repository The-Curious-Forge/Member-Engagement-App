const express = require("express");
const router = express.Router();
const {
  createMessage,
  getMessages,
  getAllMessages,
  markMessageAsRead,
} = require("../services/messagesService");

router.get("/", async (req, res, next) => {
  try {
    const messages = await getAllMessages();
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { message, memberId, isImportant } = req.body;
    const messageId = await createMessage(message, memberId, isImportant);
    req.io.emit("newMessage", { messageId, message, memberId, isImportant });
    res.status(201).json({ messageId });
  } catch (error) {
    next(error);
  }
});

router.get("/:memberId", async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { limit } = req.query;
    const messages = await getMessages(memberId, limit ? parseInt(limit) : 10);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
});

router.put("/:messageId/read", async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const updatedMessage = await markMessageAsRead(messageId);

    // Convert message data to match frontend interface exactly
    const message = {
      ...updatedMessage,
      timestamp: new Date(updatedMessage.messageDate).toISOString(),
      messageDate: new Date(updatedMessage.messageDate).toISOString(),
      toStaff: false,
      read: true,
      member: updatedMessage.member || [],
    };

    // Emit socket event with the updated message
    req.io.emit("messageRead", { messageId, message });
    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
