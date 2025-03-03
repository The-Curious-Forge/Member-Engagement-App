const Airtable = require("airtable");
const { airtableApiKey, airtableBaseId } = require("../config/config");

const base = new Airtable({ apiKey: airtableApiKey }).base(airtableBaseId);

const TABLES = {
  MASTERSHEET: "master sheet",
  MEMBER_TYPES: "Member Types",
  SIGNED_IN: "Signed In",
  USE_LOG: "Use Log",
  ACTIVITY_LOG: "Activity Log",
  ACTIVITY_LIST: "Activity List",
  ALL_MESSAGES: "All Sign In App Messages",
  RECEIVED_MESSAGES: "Received Sign In App Messages",
  KUDOS: "Kudos",
  FORGE_LEVELS: "Member Engagement Levels",
  MONTHLY_RECOGNITION: "Monthly Recognition",
  MENTORS: "Mentors",
};

module.exports = { base, TABLES };
