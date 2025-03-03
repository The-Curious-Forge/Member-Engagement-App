const express = require("express");
const router = express.Router();
const { getActivities } = require("../services/activitiesService");

router.get("/", async (req, res, next) => {
  try {
    const activities = await getActivities();
    res.status(200).json({ activities });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
