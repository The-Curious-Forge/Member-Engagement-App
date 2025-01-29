const express = require("express");
const router = express.Router();
const {
  findMember,
  getAllActiveMembers,
  getMemberTypes,
  getSignedInMembers,
  getAllMemberTypes,
  signOutAllMembers,
  getAllMemberData,
} = require("../airtableService");

// GET /allData
router.get("/allData", async (req, res) => {
  try {
    console.log("Fetching all member data...");
    const allMemberData = await getAllMemberData();
    console.log("All member data fetched successfully");
    res.status(200).json(allMemberData);
  } catch (error) {
    console.error("Error fetching all member data:", error);
    res.status(500).json({
      error: "Failed to fetch all member data",
      details: error.message,
      stack: error.stack,
    });
  }
});

// GET /allActiveMembers
router.get("/allActiveMembers", async (req, res) => {
  try {
    const members = await getAllActiveMembers();
    res.status(200).json({ members });
  } catch (error) {
    console.error("Error fetching all active members:", error);
    res.status(500).json({
      error: "Failed to fetch all active members",
      details: error.message,
    });
  }
});

// GET /search
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    console.log("Search query:", query);
    if (!query || typeof query !== "string") {
      console.log("Invalid search query");
      return res.status(400).json({ error: "Invalid search query" });
    }
    const members = await findMember(query);
    console.log("Search results:", members);
    res.status(200).json({ members });
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json({ error: "Failed to search for members", details: error.message });
  }
});

// GET /memberTypes
router.get("/memberTypes", async (req, res) => {
  try {
    console.log("Fetching all member types...");
    const memberTypes = await getAllMemberTypes();
    console.log("All member types fetched:", memberTypes);
    res.status(200).json({ memberTypes });
  } catch (error) {
    console.error("Error fetching all member types:", error);
    res.status(500).json({
      error: "Failed to get all member types",
      details: error.message,
    });
  }
});

// GET /memberTypes/:memberId
router.get("/memberTypes/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;
    console.log(`Fetching member types for member ${memberId}...`);
    const memberTypes = await getMemberTypes(memberId);
    console.log("Member types fetched:", memberTypes);
    res.status(200).json({ memberTypes });
  } catch (error) {
    console.error("Error fetching member types:", error);
    res
      .status(500)
      .json({ error: "Failed to get member types", details: error.message });
  }
});

// GET /signedInMembers
router.get("/signedInMembers", async (req, res) => {
  try {
    console.log("Fetching signed-in members...");
    const signedInMembers = await getSignedInMembers();
    console.log("Signed-in members fetched successfully:", signedInMembers);
    res.status(200).json({ signedInMembers });
  } catch (error) {
    console.error("Error fetching signed-in members:", error);
    res.status(500).json({
      error: "Failed to fetch signed-in members",
      details: error.message,
      stack: error.stack,
    });
  }
});

// New endpoint to check sign-in status
router.get("/:memberId/signInStatus", async (req, res) => {
  try {
    const { memberId } = req.params;
    console.log(`Checking sign-in status for member ${memberId}`);
    const signedInMembers = await getSignedInMembers();
    console.log(`Retrieved ${signedInMembers.length} signed-in members`);
    const isSignedIn = signedInMembers.some(
      (member) => member.memberId === memberId
    );
    console.log(`Member ${memberId} is signed in: ${isSignedIn}`);
    res.status(200).json({ isSignedIn });
  } catch (error) {
    console.error("Error checking sign-in status:", error);
    res.status(500).json({
      error: "Failed to check sign-in status",
      details: error.message,
      stack: error.stack,
    });
  }
});

// New endpoint to sign out all members
router.post("/signOutAll", async (req, res) => {
  try {
    console.log("Signing out all members...");
    const result = await signOutAllMembers();
    console.log("Sign-out all members result:", result);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(500).json({ error: result.message, details: result.error });
    }
  } catch (error) {
    console.error("Error signing out all members:", error);
    res.status(500).json({
      error: "Failed to sign out all members",
      details: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
