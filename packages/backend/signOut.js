const express = require("express");
const router = express.Router();
const { signOut, logActivity, signOutAll } = require("./airtableService");

// POST /signOut
router.post("/", async (req, res) => {
  try {
    console.log("Received sign-out request:", req.body);
    const { signInRecordId, activities } = req.body;
    if (!signInRecordId) {
      console.error("Invalid signInRecordId:", signInRecordId);
      return res.status(400).json({ error: "Invalid signInRecordId" });
    }
    if (!Array.isArray(activities)) {
      console.error("Invalid activities:", activities);
      return res.status(400).json({ error: "Invalid activities" });
    }
    console.log(
      "Calling signOut function with signInRecordId:",
      signInRecordId
    );
    const useLogRecordId = await signOut(signInRecordId);
    console.log("signOut function completed. useLogRecordId:", useLogRecordId);

    // Log activities
    console.log("Logging activities:", activities);
    for (const activity of activities) {
      if (!activity.id || typeof activity.time !== "number") {
        console.error("Invalid activity data:", activity);
        return res.status(400).json({ error: "Invalid activity data" });
      }
      console.log("Calling logActivity function:", {
        useLogRecordId,
        activityId: activity.id,
        activityTime: activity.time,
      });
      await logActivity(useLogRecordId, activity.id, activity.time);
    }
    console.log("All activities logged successfully");

    req.io.emit("signOutUpdate", {
      signInRecordId,
      useLogRecordId,
      activities,
    });
    console.log("signOutUpdate event emitted");
    res.status(200).json({ success: true, useLogRecordId });
  } catch (error) {
    console.error("Error in sign-out process:", error);
    res.status(500).json({ error: "Sign-out failed", details: error.message });
  }
});

// POST /signOut/all - Sign out all members
router.post("/all", async (req, res) => {
  try {
    console.log("Received sign-out-all request");
    const result = await signOutAllMembers();
    if (result.success) {
      req.io.emit("signOutAllUpdate");
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Error in sign-out-all process:", error);
    res
      .status(500)
      .json({ error: "Sign-out-all failed", details: error.message });
  }
});

module.exports = router;
