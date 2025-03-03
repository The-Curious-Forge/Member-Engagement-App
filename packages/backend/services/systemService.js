const { base, TABLES } = require("./airtableClient");

async function testMastersheetAccess() {
  try {
    const records = await base(TABLES.MASTERSHEET).select().firstPage();
    return {
      canAccess: true,
      recordCount: records.length,
      firstRecordFields:
        records.length > 0 ? Object.keys(records[0].fields) : [],
    };
  } catch (error) {
    return { canAccess: false, error: error.message };
  }
}

async function listTables() {
  try {
    const tables = await base.tables();
    return tables.map((table) => table.name);
  } catch (error) {
    return [];
  }
}

async function testActivitiesAccess() {
  try {
    const records = await base(TABLES.ACTIVITY_LIST).select().firstPage();
    return records.length > 0;
  } catch (error) {
    return false;
  }
}

async function testMemberTypesAccess() {
  try {
    const records = await base(TABLES.MEMBER_TYPES).select().firstPage();
    return records.length > 0;
  } catch (error) {
    return false;
  }
}

async function getMonthlyRecognition(month) {
  console.log("Fetching monthly recognition for month:", month);
  try {
    // Validate month format
    if (!month || !month.match(/^\d{4}-\d{2}$/)) {
      console.error("Invalid month format:", month);
      return [];
    }

    const [year, monthStr] = month.split("-");
    const monthNum = parseInt(monthStr);

    // Validate month number
    if (monthNum < 1 || monthNum > 12) {
      console.error("Invalid month number:", monthNum);
      return [];
    }

    const records = await base(TABLES.MONTHLY_RECOGNITION)
      .select({
        filterByFormula: `AND(
          YEAR({Month}) = ${year},
          MONTH({Month}) = ${monthNum}
        )`,
      })
      .firstPage();

    console.log("Found records:", records.length);
    if (records.length > 0) {
      console.log("First record fields:", {
        month: records[0].get("Month"),
        memberOfTheMonth: records[0].get("Member of the Month"),
        projectOfTheMonth: records[0].get("Project of the Month"),
        projectMembers: records[0].get("Project Member(s)"),
      });
    } else {
      console.log("No records found for", month);
    }

    const processedRecords = await Promise.all(
      records.map(async (record) => {
        try {
          const memberOfTheMonth = record.get("Member of the Month");
          console.log("Member of the Month raw value:", memberOfTheMonth);

          // Get member of the month details
          const memberDetails =
            memberOfTheMonth && memberOfTheMonth.length > 0
              ? await base(TABLES.MASTERSHEET).find(memberOfTheMonth[0])
              : null;

          // Get project members details
          const projectMemberIds = record.get("Project Member(s)") || [];
          const projectMemberDetails =
            projectMemberIds.length > 0
              ? await Promise.all(
                  projectMemberIds.map(async (memberId) => {
                    try {
                      const member = await base(TABLES.MASTERSHEET).find(
                        memberId
                      );
                      return {
                        id: member.id,
                        name: `${member.get("Preferred Name") || ""} ${
                          member.get("Last Name") || ""
                        }`.trim(),
                        headshot: member.get("Headshot")
                          ? member.get("Headshot")[0].url
                          : "",
                      };
                    } catch (error) {
                      console.error(
                        "Error fetching project member:",
                        memberId,
                        error
                      );
                      return null;
                    }
                  })
                ).then((members) => members.filter(Boolean))
              : [];

          return {
            id: record.id,
            month: record.get("Month"),
            memberOfTheMonth: memberDetails
              ? {
                  id: memberDetails.id,
                  name: `${memberDetails.get("Preferred Name") || ""} ${
                    memberDetails.get("Last Name") || ""
                  }`.trim(),
                  headshot: memberDetails.get("Headshot")
                    ? memberDetails.get("Headshot")[0].url
                    : "",
                }
              : null,
            recognitionReason: record.get("Member Recognition Reason"),
            projectOfTheMonth: record.get("Project of the Month") || "",
            projectDescription: record.get("Project Description") || "",
            projectPhotos: record.get("Project Photos")
              ? record.get("Project Photos").map((photo) => photo.url)
              : [],
            projectMembers: projectMemberDetails,
          };
        } catch (error) {
          console.error("Error processing record:", record.id, error);
          return null;
        }
      })
    );

    return processedRecords.filter(Boolean); // Remove any null records from processing errors
  } catch (error) {
    console.error("Error fetching monthly recognition:", error);
    return [];
  }
}

async function syncWithAirtable() {
  try {
    const activeMembers =
      await require("./membersService").getAllActiveMembers();
    const memberTypes = await require("./membersService").getAllMemberTypes();
    const activities = await require("./activitiesService").getActivities();
    const kudos = await require("./kudosService").getAllKudos();
    return {
      success: true,
      message: "Synchronization completed successfully",
      syncedData: {
        activeMembers: activeMembers.length,
        memberTypes: memberTypes.length,
        activities: activities.length,
        kudos: kudos.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Synchronization failed",
      error: error.message,
    };
  }
}

module.exports = {
  testMastersheetAccess,
  listTables,
  testActivitiesAccess,
  testMemberTypesAccess,
  getMonthlyRecognition,
  syncWithAirtable,
};
