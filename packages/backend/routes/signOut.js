const express = require("express");
const router = express.Router();
const { signOut, signOutAllMembers } = require("../services/membersService");
const { base, TABLES } = require("../services/airtableClient");

// Simple helper to log activity during sign-out
async function logActivity(useLogRecordId, activityId, activityTime) {
  const record = await base(TABLES.ACTIVITY_LOG).create({
    Activity: [activityId],
    ActivityTime: activityTime,
    LogInSession: [useLogRecordId],
  });
  return record.id;
}

router.post("/", async (req, res, next) => {
  try {
    const { signInRecordId, activities, memberId } = req.body;
    if (!signInRecordId) {
      return res.status(400).json({ error: "Invalid signInRecordId" });
    }
    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: "Invalid activities" });
    }
    const useLogRecordId = await signOut(signInRecordId);
    for (const activity of activities) {
      if (!activity.id || typeof activity.time !== "number") {
        return res.status(400).json({ error: "Invalid activity data" });
      }
      await logActivity(useLogRecordId, activity.id, activity.time);
    }
    req.io.emit("signOutUpdate", {
      signInRecordId,
      useLogRecordId,
      activities,
      memberId,
    });
    res.status(200).json({ success: true, useLogRecordId });
  } catch (error) {
    next(error);
  }
});

router.post("/all", async (req, res, next) => {
  try {
    const result = await signOutAllMembers();
    req.io.emit("signOutAllUpdate");
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
