const express = require("express");
const router = express.Router();
const {
  createMessage,
  getMessages,
  getAllMessages,
  markMessageAsRead,
} = require("../airtableService");

// GET /api/messages
router.get("/", async (req, res) => {
  try {
    const messages = await getAllMessages();
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching all messages", error);
    res
      .status(500)
      .json({ error: "Failed to fetch all messages", details: error.message });
  }
});

// POST /api/messages
router.post("/", async (req, res) => {
  try {
    const { message, memberId, isImportant } = req.body;
    const messageId = await createMessage(message, memberId, isImportant);

    // Emit a socket event for the new message
    req.io.emit("newMessage", { messageId, message, memberId, isImportant });

    res.status(201).json({ messageId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

// GET /api/messages/:memberId
router.get("/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;
    const { limit } = req.query;
    console.log(`Fetching messages for memberId: ${memberId}, limit: ${limit}`);
    const messages = await getMessages(memberId, limit ? parseInt(limit) : 10);
    console.log(
      `Retrieved ${messages.length} messages for memberId: ${memberId}`
    );
    res.status(200).json({ messages });
  } catch (error) {
    console.error(
      `Error fetching messages for memberId: ${req.params.memberId}`,
      error
    );
    res
      .status(500)
      .json({ error: "Failed to fetch messages", details: error.message });
  }
});

// PUT /api/messages/:messageId/read
router.put("/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    await markMessageAsRead(messageId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

module.exports = router;
