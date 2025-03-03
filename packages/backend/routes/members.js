const express = require("express");
const router = express.Router();
const {
  findMember,
  getAllActiveMembers,
  getMemberTypes,
  getAllMemberTypes,
  getSignedInMembers,
  signOutAllMembers,
  getAllMemberData,
  getMonthlyRecognition,
} = require("../services/membersService");

router.get("/allData", async (req, res, next) => {
  try {
    const allMemberData = await getAllMemberData();
    res.status(200).json(allMemberData);
  } catch (error) {
    next(error);
  }
});

router.get("/allActiveMembers", async (req, res, next) => {
  try {
    const members = await getAllActiveMembers();
    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Invalid search query" });
    }
    const members = await findMember(query);
    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
});

router.get("/memberTypes", async (req, res, next) => {
  try {
    const memberTypes = await getAllMemberTypes();
    res.status(200).json({ memberTypes });
  } catch (error) {
    next(error);
  }
});

router.get("/memberTypes/:memberId", async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const memberTypes = await getMemberTypes(memberId);
    res.status(200).json({ memberTypes });
  } catch (error) {
    next(error);
  }
});

router.get("/signedInMembers", async (req, res, next) => {
  try {
    const signedInMembers = await getSignedInMembers();
    res.status(200).json({ signedInMembers });
  } catch (error) {
    next(error);
  }
});

router.get("/:memberId/signInStatus", async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const signedInMembers = await getSignedInMembers();
    const isSignedIn = signedInMembers.some((member) => member.id === memberId);
    res.status(200).json({ isSignedIn });
  } catch (error) {
    next(error);
  }
});

router.get("/monthlyRecognition/:month", async (req, res, next) => {
  try {
    const { month } = req.params;
    console.log("Received request for monthly recognition:", month);
    const recognition = await getMonthlyRecognition(month);
    console.log("Recognition data:", recognition);
    if (!recognition) {
      return res
        .status(404)
        .json({ error: "No recognition data found for this month" });
    }
    res.status(200).json(recognition);
  } catch (error) {
    console.error("Error in monthly recognition route:", error);
    next(error);
  }
});

router.post("/signOutAll", async (req, res, next) => {
  try {
    const result = await signOutAllMembers();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
