const express = require("express");
const router = express.Router();
const {
  createKudos,
  getAllKudos,
  getKudosStats,
} = require("../services/kudosService");

router.post("/", async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    if (
      !from ||
      !to ||
      !Array.isArray(to) ||
      to.length === 0 ||
      !message?.trim()
    ) {
      return res
        .status(400)
        .json({
          error: "Invalid input: sender, recipients, and message are required",
        });
    }
    const newKudos = await createKudos(from, to, message);
    req.io.emit("kudosUpdate", newKudos);
    res
      .status(201)
      .json({
        success: true,
        kudos: newKudos,
        message: "Kudos sent successfully",
      });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const kudos = await getAllKudos();
    res.status(200).json({ kudos });
  } catch (error) {
    next(error);
  }
});

router.get("/stats/:memberId", async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const stats = await getKudosStats(memberId);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
