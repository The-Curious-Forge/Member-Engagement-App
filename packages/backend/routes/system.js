const express = require("express");
const router = express.Router();
const {
  testMastersheetAccess,
  listTables,
  testActivitiesAccess,
  testMemberTypesAccess,
  syncWithAirtable,
  getMonthlyRecognition,
} = require("../services/systemService");

router.get("/testMemberTypesAccess", async (req, res, next) => {
  try {
    const canAccess = await testMemberTypesAccess();
    res.status(200).json({ canAccess });
  } catch (error) {
    next(error);
  }
});

router.get("/testActivitiesAccess", async (req, res, next) => {
  try {
    const canAccess = await testActivitiesAccess();
    res.status(200).json({ canAccess });
  } catch (error) {
    next(error);
  }
});

router.get("/listTables", async (req, res, next) => {
  try {
    const tables = await listTables();
    res.status(200).json({ tables });
  } catch (error) {
    next(error);
  }
});

router.get("/testMastersheetAccess", async (req, res, next) => {
  try {
    const result = await testMastersheetAccess();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/syncWithAirtable", async (req, res, next) => {
  try {
    const result = await syncWithAirtable();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
