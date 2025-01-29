const express = require("express");
const router = express.Router();
const {
  getAllMemberData,
  getAllKudos,
  getActivities,
  getSignedInMembers,
  getAllMemberTypes,
  getAllMessages,
  getMonthlyRecognition,
} = require("../airtableService");

router.get("/allData", async (req, res) => {
  try {
    console.log("Fetching all Airtable data...");
    const currentMonth = new Date().toISOString().slice(0, 7); // Get current month in YYYY-MM format
    const [
      members,
      kudos,
      activities,
      signedInMembers,
      memberTypes,
      messages,
      monthlyRecognition,
    ] = await Promise.all([
      getAllMemberData(),
      getAllKudos(),
      getActivities(),
      getSignedInMembers(),
      getAllMemberTypes(),
      getAllMessages(),
      getMonthlyRecognition(currentMonth),
    ]);

    let memberOfTheMonth = null;
    if (monthlyRecognition.length > 0) {
      const recognition = monthlyRecognition[0];
      const memberData = members.find(
        (m) => m.id === recognition.memberOfTheMonth[0]
      );
      if (memberData) {
        memberOfTheMonth = {
          id: memberData.id,
          name: memberData.name,
          headshot: memberData.headshot,
          recognitionReason: recognition.recognitionReason,
        };
      }
    }

    const allData = {
      members,
      kudos,
      activities,
      signedInMembers,
      memberTypes,
      messages,
      memberOfTheMonth,
    };

    console.log("All Airtable data fetched successfully");
    res.status(200).json(allData);
  } catch (error) {
    console.error("Error fetching all Airtable data:", error);
    res.status(500).json({
      error: "Failed to fetch all Airtable data",
      details: error.message,
    });
  }
});

module.exports = router;
