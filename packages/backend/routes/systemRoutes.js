const express = require("express");
const router = express.Router();
const {
  testMastersheetAccess,
  listTables,
  testActivitiesAccess,
  testMemberTypesAccess,
  syncWithAirtable,
} = require("../airtableService");

// GET /testMemberTypesAccess
router.get("/testMemberTypesAccess", async (req, res) => {
  try {
    const canAccess = await testMemberTypesAccess();
    res.status(200).json({ canAccess });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to test Member Types table access",
      details: error.message,
    });
  }
});

// GET /testActivitiesAccess
router.get("/testActivitiesAccess", async (req, res) => {
  try {
    const canAccess = await testActivitiesAccess();
    res.status(200).json({ canAccess });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to test Activities table access",
      details: error.message,
    });
  }
});

// GET /listTables
router.get("/listTables", async (req, res) => {
  try {
    const tables = await listTables();
    res.status(200).json({ tables });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to list tables",
      details: error.message,
    });
  }
});

// GET /testMastersheetAccess
router.get("/testMastersheetAccess", async (req, res) => {
  try {
    const result = await testMastersheetAccess();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to test mastersheet access",
      details: error.message,
    });
  }
});

// POST /syncWithAirtable
router.post("/syncWithAirtable", async (req, res) => {
  try {
    const result = await syncWithAirtable();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to sync with Airtable",
      details: error.message,
    });
  }
});

module.exports = router;
