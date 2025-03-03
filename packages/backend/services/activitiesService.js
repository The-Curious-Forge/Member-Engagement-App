const { base, TABLES } = require("./airtableClient");

async function getActivities() {
  const records = await base(TABLES.ACTIVITY_LIST).select().firstPage();
  return records.map((record) => ({
    id: record.id,
    activity: record.get("Activity"),
  }));
}

module.exports = { getActivities };
