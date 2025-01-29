const express = require("express");
const router = express.Router();
const { signIn, getSignedInMembers } = require("./airtableService");

// POST /
router.post("/", async (req, res) => {
  try {
    const { memberId, memberTypeId } = req.body;
    if (!memberId || !memberTypeId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const signInRecordId = await signIn(memberId, memberTypeId);

    // Get updated signed-in members list
    const signedInMembers = await getSignedInMembers();
    const updatedMember = signedInMembers.find(
      (m) => m.signInRecordId === signInRecordId
    );

    if (updatedMember) {
      req.io.emit("signInUpdate", updatedMember);
    }

    res.status(200).json({ success: true, signInRecordId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sign-in failed" });
  }
});

module.exports = router;
