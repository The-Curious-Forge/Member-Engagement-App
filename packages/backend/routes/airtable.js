const express = require("express");
const router = express.Router();
const { getAllAirtableData } = require("../services/membersService");

router.get("/allData", async (req, res, next) => {
  try {
    const allData = await getAllAirtableData();
    res.status(200).json(allData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
