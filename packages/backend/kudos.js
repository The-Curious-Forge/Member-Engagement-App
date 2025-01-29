const express = require("express");
const router = express.Router();
const {
  createKudos,
  getAllKudos,
  getKudosStats,
} = require("./airtableService");

// POST /kudos
router.post("/", async (req, res) => {
  try {
    console.log("Received kudos request:", req.body);
    const { from, to, message } = req.body;
    if (!from) {
      console.log("Error: Sender (from) is missing");
      return res.status(400).json({ error: "Sender (from) is required" });
    }
    if (!to || !Array.isArray(to) || to.length === 0) {
      console.log("Error: Invalid recipients (to):", to);
      return res
        .status(400)
        .json({ error: "At least one recipient (to) is required" });
    }
    if (!message || message.trim().length === 0) {
      console.log("Error: Message is missing or empty");
      return res.status(400).json({ error: "Message is required" });
    }
    console.log("Creating kudos with:", { from, to, message });
    const newKudos = await createKudos(from, to, message);
    console.log("Kudos created successfully:", newKudos);
    req.io.emit("kudosUpdate", newKudos);
    res.status(201).json({
      success: true,
      kudos: newKudos,
      message: "Kudos sent successfully",
    });
  } catch (error) {
    console.error("Error sending kudos:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to send kudos",
      details: error.message,
      stack: error.stack,
    });
  }
});

// GET /
router.get("/", async (req, res) => {
  try {
    const kudos = await getAllKudos();
    res.status(200).json({ kudos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve kudos" });
  }
});

// GET /stats/:memberId
router.get("/stats/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;
    const stats = await getKudosStats(memberId);
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve kudos stats" });
  }
});

module.exports = router;
