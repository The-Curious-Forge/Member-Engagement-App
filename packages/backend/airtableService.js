const Airtable = require("airtable");
require("dotenv").config();

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error(
    "Airtable API key or Base ID is missing in environment variables"
  );
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

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
};

async function findMember(query) {
  const lowercaseQuery = query.toLowerCase();
  const records = await base(TABLES.MASTERSHEET)
    .select({
      view: "Sign-in App",
      filterByFormula: `OR(
        SEARCH("${lowercaseQuery}", LOWER({Preferred Name})),
        SEARCH("${lowercaseQuery}", LOWER({Last Name}))
      )`,
    })
    .firstPage();
  return records.map((record) => ({
    id: record.id,
    name: `${record.get("Preferred Name") || ""} ${
      record.get("Last Name") || ""
    }`.trim(),
    memberTypes: record.get("Member Types") || [],
    totalHours: record.get("totalHours") || 0,
    totalPoints: record.get("Total Points") || 0,
    weeklyStreak: record.get("WeeklyStreak") || 0,
    forgeLevel: record.get("ForgeLevel")
      ? record.get("ForgeLevel")[0]?.fields?.["Level Name"]
      : "Novice",
    memberBio: record.get("Member Bio") || "",
    headshot: record.get("Headshot") ? record.get("Headshot")[0].url : "",
    topActivities: record.get("topActivities") || "",
  }));
}

async function getAllActiveMembers() {
  console.log("Fetching all active members...");
  const startTime = Date.now();

  const [records, forgeLevels] = await Promise.all([
    base(TABLES.MASTERSHEET)
      .select({
        view: "Sign-in App",
      })
      .all(),
    base(TABLES.FORGE_LEVELS).select().all(),
  ]);

  const fetchTime = Date.now() - startTime;
  console.log(`Fetched data from Airtable in ${fetchTime}ms`);

  const forgeLevelMap = new Map(
    forgeLevels.map((level) => [level.id, level.get("Level Name")])
  );

  const members = records.map((record) => {
    const forgeLevel = record.get("ForgeLevel");
    const forgeLevelName =
      forgeLevel && forgeLevel.length > 0
        ? forgeLevelMap.get(forgeLevel[0]) || "Novice"
        : "Novice";

    const qualifications = record.get("updatedQualifications");
    console.log(
      `Raw qualifications for ${record.get("Preferred Name")}:`,
      qualifications
    );

    const qualificationNames = qualifications || "";

    console.log(
      `Processed qualifications for ${record.get("Preferred Name")}:`,
      qualificationNames
    );

    return {
      id: record.id,
      name: `${record.get("Preferred Name") || ""} ${
        record.get("Last Name") || ""
      }`.trim(),
      memberTypes: record.get("Member Types") || [],
      totalHours: record.get("totalHours") || 0,
      totalPoints: record.get("Total Points") || 0,
      weeklyStreak: record.get("WeeklyStreak") || 0,
      forgeLevel: forgeLevelName,
      memberBio: record.get("Member Bio") || "",
      headshot: record.get("Headshot") ? record.get("Headshot")[0].url : "",
      topActivities: record.get("topActivities") || "",
      updatedQualifications: qualificationNames,
    };
  });

  const totalTime = Date.now() - startTime;
  console.log(
    `Fetched and processed ${members.length} active members in ${totalTime}ms`
  );
  console.log(`Processing time: ${totalTime - fetchTime}ms`);

  return members;
}

async function signIn(memberId, memberTypeId) {
  const record = await base(TABLES.SIGNED_IN).create({
    Member: [memberId],
    SignInTime: new Date().toISOString(),
    SignedInType: [memberTypeId],
  });
  return record.id;
}

async function signOut(signInRecordId) {
  console.log(`Attempting to sign out record: ${signInRecordId}`);
  try {
    const signInRecord = await base(TABLES.SIGNED_IN).find(signInRecordId);
    console.log(`Found sign-in record:`, signInRecord);

    await base(TABLES.SIGNED_IN).destroy(signInRecordId);
    console.log(`Destroyed sign-in record: ${signInRecordId}`);

    const useLogRecord = await base(TABLES.USE_LOG).create({
      Member: signInRecord.get("Member"),
      SignInTime: signInRecord.get("SignInTime"),
      SignOutTime: new Date().toISOString(),
      SignedInAs: signInRecord.get("SignedInType"),
    });
    console.log(`Created use log record: ${useLogRecord.id}`);

    return useLogRecord.id;
  } catch (error) {
    console.error(`Error in signOut function:`, error);
    throw error;
  }
}

async function createKudos(from, to, message) {
  const record = await base(TABLES.KUDOS).create({
    From: from ? [from] : null,
    To: to,
    Message: message,
    Date: new Date().toISOString(),
  });

  const [fromMember] = from
    ? await base(TABLES.MASTERSHEET)
        .select({
          filterByFormula: `RECORD_ID() = '${from}'`,
        })
        .firstPage()
    : [];
  const toMembers = await Promise.all(
    to.map((id) =>
      base(TABLES.MASTERSHEET)
        .select({
          filterByFormula: `RECORD_ID() = '${id}'`,
        })
        .firstPage()
    )
  );

  return {
    id: record.id,
    from: from
      ? [
          {
            id: from,
            name: fromMember
              ? `${fromMember.get("Preferred Name") || ""} ${
                  fromMember.get("Last Name") || ""
                }`.trim()
              : "Unknown",
          },
        ]
      : [],
    to: toMembers.map((memberRecords) => {
      const member = memberRecords[0];
      return {
        id: member.id,
        name: `${member.get("Preferred Name") || ""} ${
          member.get("Last Name") || ""
        }`.trim(),
      };
    }),
    message: message,
    date: record.get("Date"),
  };
}

async function getAllKudos() {
  const kudosRecords = await base(TABLES.KUDOS)
    .select({
      sort: [{ field: "Date", direction: "desc" }],
    })
    .all();

  const memberIds = new Set();
  kudosRecords.forEach((record) => {
    const fromIds = record.get("From") || [];
    const toIds = record.get("To") || [];
    fromIds.forEach((id) => memberIds.add(id));
    toIds.forEach((id) => memberIds.add(id));
  });

  const memberRecords = await base(TABLES.MASTERSHEET)
    .select({
      filterByFormula: `OR(${Array.from(memberIds)
        .map((id) => `RECORD_ID()='${id}'`)
        .join(",")})`,
    })
    .all();

  const memberMap = new Map(
    memberRecords.map((record) => [
      record.id,
      `${record.get("Preferred Name") || ""} ${
        record.get("Last Name") || ""
      }`.trim(),
    ])
  );

  return kudosRecords.map((record) => ({
    id: record.id,
    from: (record.get("From") || []).map((id) => ({
      id,
      name: memberMap.get(id) || id,
    })),
    to: (record.get("To") || []).map((id) => ({
      id,
      name: memberMap.get(id) || id,
    })),
    message: record.get("Message"),
    date: record.get("Date"),
  }));
}

async function getKudosStats(memberId) {
  const kudosRecords = await base(TABLES.KUDOS).select().all();

  let kudosGiven = 0;
  let kudosReceived = 0;

  kudosRecords.forEach((record) => {
    const fromIds = record.get("From") || [];
    const toIds = record.get("To") || [];

    if (fromIds.includes(memberId)) {
      kudosGiven++;
    }

    if (toIds.includes(memberId)) {
      kudosReceived++;
    }
  });

  return { kudosGiven, kudosReceived };
}

async function getMemberTypes(memberId) {
  console.log("Fetching member types from Airtable...");
  try {
    const memberRecord = await base(TABLES.MASTERSHEET).find(memberId);
    const memberTypeIds = memberRecord.get("Member Types") || [];

    const records = await base(TABLES.MEMBER_TYPES)
      .select({
        filterByFormula: `AND(
        {Show Sign In Option},
        OR(${memberTypeIds.map((id) => `RECORD_ID() = '${id}'`).join(",")})
      )`,
        sort: [{ field: "SortingOrder", direction: "asc" }],
      })
      .firstPage();

    console.log(
      `Fetched ${records.length} member types for member ${memberId}`
    );
    const memberTypes = records.map((record) => ({
      id: record.id,
      group: record.get("Group"),
      sortingOrder: record.get("SortingOrder"),
    }));
    console.log("Processed member types:", memberTypes);
    return memberTypes;
  } catch (error) {
    console.error("Error fetching member types from Airtable:", error);
    throw error;
  }
}

async function getAllMemberTypes() {
  console.log("Fetching all member types from Airtable...");
  try {
    const records = await base(TABLES.MEMBER_TYPES)
      .select({
        filterByFormula: "{Show Sign In Option}",
      })
      .all();

    console.log(`Fetched ${records.length} member types`);
    const memberTypes = records.map((record) => ({
      id: record.id,
      group: record.get("Group"),
      sortingOrder: record.get("SortingOrder"),
    }));
    console.log("Processed all member types:", memberTypes);
    return memberTypes;
  } catch (error) {
    console.error("Error fetching all member types from Airtable:", error);
    throw error;
  }
}

async function logActivity(useLogId, activityId, activityTime) {
  const record = await base(TABLES.ACTIVITY_LOG).create({
    Activity: [activityId],
    ActivityTime: activityTime,
    LogInSession: [useLogId],
  });
  return record.id;
}

async function getActivities() {
  console.log("Fetching activities from Airtable...");
  try {
    const records = await base(TABLES.ACTIVITY_LIST).select().firstPage();
    console.log(`Fetched ${records.length} activities from Airtable`);
    const activities = records.map((record) => ({
      id: record.id,
      activity: record.get("Activity"),
    }));
    console.log("Processed activities:", activities);
    return activities;
  } catch (error) {
    console.error("Error fetching activities from Airtable:", error);
    throw error;
  }
}

async function createMessage(message, memberId = null, isImportant = false) {
  try {
    console.log("Creating message:", { message, memberId, isImportant });
    const record = await base(TABLES.RECEIVED_MESSAGES).create({
      Message: message,
      "Message Date": new Date().toISOString(),
      Member: memberId ? [memberId] : null,
      Important: isImportant,
    });
    console.log("Message created successfully:", record.id);
    return record.id;
  } catch (error) {
    console.error("Error creating message:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw error;
  }
}

async function getMessages(memberId, limit = 10) {
  console.log(
    `Querying Airtable for messages. MemberId: ${memberId}, Limit: ${limit}`
  );
  try {
    const query = {
      sort: [{ field: "Message Date", direction: "desc" }],
    };
    console.log("Airtable query:", JSON.stringify(query, null, 2));

    const records = await base(TABLES.ALL_MESSAGES).select(query).all();

    console.log(
      `Airtable query successful. Retrieved ${records.length} total records.`
    );

    const filteredRecords = records.filter((record) => {
      const memberIds = record.get("Member") || [];
      return memberIds.includes(memberId);
    });

    console.log(
      `Filtered ${filteredRecords.length} records for memberId: ${memberId}`
    );

    const messages = filteredRecords.slice(0, limit).map((record) => ({
      id: record.id,
      message: record.get("Message"),
      messageDate: record.get("Message Date"),
      readDate: record.get("Read Date"),
      important: record.get("Important"),
      appNotification: record.get("App Notification"),
    }));

    console.log(`Sample message:`, JSON.stringify(messages[0], null, 2));

    console.log(
      `Processed ${messages.length} messages for memberId: ${memberId}`
    );
    return messages;
  } catch (error) {
    console.error(
      `Error querying Airtable for messages. MemberId: ${memberId}`,
      error
    );
    throw error;
  }
}

async function getAllMessages() {
  console.log("Querying Airtable for all messages");
  try {
    const query = {
      sort: [{ field: "Message Date", direction: "desc" }],
    };
    console.log("Airtable query:", JSON.stringify(query, null, 2));

    const records = await base(TABLES.ALL_MESSAGES).select(query).all();

    console.log(
      `Airtable query successful. Retrieved ${records.length} total records.`
    );

    const messages = records.map((record) => ({
      id: record.id,
      message: record.get("Message"),
      messageDate: record.get("Message Date"),
      readDate: record.get("Read Date"),
      important: record.get("Important"),
      appNotification: record.get("App Notification"),
      member: record.get("Member"),
    }));

    console.log(`Processed ${messages.length} messages`);
    return messages;
  } catch (error) {
    console.error("Error querying Airtable for all messages:", error);
    throw error;
  }
}

async function markMessageAsRead(messageId) {
  const record = await base(TABLES.ALL_MESSAGES).update(messageId, {
    "Read Date": new Date().toISOString(),
  });
  return record.id;
}

async function getForgeLevels() {
  const records = await base(TABLES.FORGE_LEVELS).select().firstPage();
  return records.map((record) => ({
    id: record.id,
    levelName: record.get("Level Name"),
    minimumPoints: record.get("Minimum Points"),
  }));
}

async function getMonthlyRecognition(month) {
  const records = await base(TABLES.MONTHLY_RECOGNITION)
    .select({
      filterByFormula: `DATETIME_FORMAT({Month}, 'YYYY-MM') = '${month}'`,
    })
    .firstPage();

  return records.map((record) => ({
    id: record.id,
    month: record.get("Month"),
    memberOfTheMonth: record.get("Member of the Month"),
    recognitionReason: record.get("Member Recognition Reason"),
  }));
}

async function getSignedInMembers() {
  console.log("Fetching signed-in members...");
  try {
    const records = await base(TABLES.SIGNED_IN)
      .select({
        filterByFormula: "{SignOutTime} = BLANK()",
      })
      .all();
    console.log(`Found ${records.length} signed-in records`);

    const memberIds = records
      .map((record) => {
        const member = record.get("Member");
        return member && member.length > 0 ? member[0] : null;
      })
      .filter((id) => id !== null);

    const memberTypeIds = records
      .map((record) => {
        const signedInType = record.get("SignedInType");
        return signedInType && signedInType.length > 0 ? signedInType[0] : null;
      })
      .filter((id) => id !== null);

    console.log("Fetching member details from mastersheet...");
    const memberRecords =
      memberIds.length > 0
        ? await base(TABLES.MASTERSHEET)
            .select({
              filterByFormula: `OR(${memberIds
                .map((id) => `RECORD_ID()='${id}'`)
                .join(",")})`,
            })
            .all()
        : [];
    console.log(`Found ${memberRecords.length} member records`);

    console.log("Fetching member type details...");
    const memberTypeRecords =
      memberTypeIds.length > 0
        ? await base(TABLES.MEMBER_TYPES)
            .select({
              filterByFormula: `OR(${memberTypeIds
                .map((id) => `RECORD_ID()='${id}'`)
                .join(",")})`,
            })
            .all()
        : [];
    console.log(`Found ${memberTypeRecords.length} member type records`);

    const memberMap = new Map(
      memberRecords.map((record) => [
        record.id,
        {
          id: record.id,
          name: `${record.get("Preferred Name") || ""} ${
            record.get("Last Name") || ""
          }`.trim(),
          headshot:
            record.get("Headshot") && record.get("Headshot").length > 0
              ? record.get("Headshot")[0].url
              : "",
          memberTypes: record.get("Member Types") || [],
        },
      ])
    );

    const memberTypeMap = new Map(
      memberTypeRecords.map((record) => [
        record.id,
        {
          id: record.id,
          group: record.get("Group"),
          sortingOrder: record.get("SortingOrder"),
        },
      ])
    );

    const signedInMembers = records.map((record) => {
      const memberId =
        record.get("Member") && record.get("Member").length > 0
          ? record.get("Member")[0]
          : null;
      const memberInfo = memberId ? memberMap.get(memberId) : null;
      const signedInTypeId =
        record.get("SignedInType") && record.get("SignedInType").length > 0
          ? record.get("SignedInType")[0]
          : null;
      const signedInType = signedInTypeId
        ? memberTypeMap.get(signedInTypeId)
        : null;

      return {
        ...memberInfo,
        signInRecordId: record.id,
        signInTime: record.get("SignInTime"),
        signedInType: signedInTypeId, // Add the signedInType ID
        memberType: signedInType?.group || "Member", // Use the group from the signed-in type
      };
    });

    console.log(`Returning ${signedInMembers.length} signed-in members`);
    return signedInMembers;
  } catch (error) {
    console.error("Error in getSignedInMembers:", error);
    throw error;
  }
}

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
    console.error("Error accessing mastersheet:", error);
    return {
      canAccess: false,
      error: error.message,
    };
  }
}

async function listTables() {
  try {
    const tables = await base.tables();
    return tables.map((table) => table.name);
  } catch (error) {
    console.error("Error listing tables:", error);
    return [];
  }
}

async function testActivitiesAccess() {
  try {
    const records = await base(TABLES.ACTIVITY_LIST).select().firstPage();
    return records.length > 0;
  } catch (error) {
    console.error("Error accessing Activities table:", error);
    return false;
  }
}

async function testMemberTypesAccess() {
  try {
    const records = await base(TABLES.MEMBER_TYPES).select().firstPage();
    return records.length > 0;
  } catch (error) {
    console.error("Error accessing Member Types table:", error);
    return false;
  }
}

async function syncWithAirtable() {
  console.log("Starting Airtable synchronization...");
  try {
    // Perform synchronization tasks here
    // For example, you might want to:
    // 1. Fetch the latest data from various tables
    // 2. Update local data structures or databases
    // 3. Perform any necessary data reconciliation

    const activeMembers = await getAllActiveMembers();
    const memberTypes = await getAllMemberTypes();
    const activities = await getActivities();
    const kudos = await getAllKudos();

    // You might want to update your local database or perform other operations with this data

    console.log("Airtable synchronization completed successfully");
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
    console.error("Error during Airtable synchronization:", error);
    return {
      success: false,
      message: "Synchronization failed",
      error: error.message,
    };
  }
}

async function signOutAllMembers() {
  console.log("Signing out all members...");
  try {
    const signedInRecords = await base(TABLES.SIGNED_IN).select().all();
    console.log(`Found ${signedInRecords.length} signed-in records`);

    const signOutPromises = signedInRecords.map(async (record) => {
      const signOutTime = new Date().toISOString();
      await base(TABLES.USE_LOG).create({
        Member: record.get("Member"),
        SignInTime: record.get("SignInTime"),
        SignOutTime: signOutTime,
        SignedInAs: record.get("SignedInType"),
      });
      await base(TABLES.SIGNED_IN).destroy(record.id);
    });

    await Promise.all(signOutPromises);
    console.log("All members have been signed out successfully");
    return { success: true, message: "All members have been signed out" };
  } catch (error) {
    console.error("Error signing out all members:", error);
    return {
      success: false,
      message: "Failed to sign out all members",
      error: error.message,
    };
  }
}

async function getAllMemberData() {
  console.log("Fetching all member data...");
  try {
    const members = await getAllActiveMembers();
    const memberIds = members.map((member) => member.id);

    const [allMessages, allMemberTypes, signedInMembers, allKudos] =
      await Promise.all([
        getAllMessages(),
        getAllMemberTypes(),
        getSignedInMembers(),
        getAllKudos(),
      ]);

    const membersWithData = await Promise.all(
      members.map(async (member) => {
        const memberMessages = allMessages.filter(
          (message) => message.member && message.member.includes(member.id)
        );
        const memberTypes = member.memberTypes
          .map((typeId) => allMemberTypes.find((type) => type.id === typeId))
          .filter((type) => type !== undefined);
        const isSignedIn = signedInMembers.some(
          (signedInMember) => signedInMember.memberId === member.id
        );

        // Get kudos for the member
        const kudosGiven = allKudos.filter((kudos) =>
          kudos.from.some((sender) => sender.id === member.id)
        );
        const kudosReceived = allKudos.filter((kudos) =>
          kudos.to.some((recipient) => recipient.id === member.id)
        );

        return {
          ...member,
          messages: memberMessages,
          memberTypes: memberTypes,
          isSignedIn: isSignedIn,
          kudosGiven,
          kudosReceived,
        };
      })
    );

    console.log(`Fetched data for ${membersWithData.length} members`);
    return membersWithData;
  } catch (error) {
    console.error("Error fetching all member data:", error);
    throw error;
  }
}

async function getAllAirtableData() {
  console.log("Fetching all Airtable data...");
  try {
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
      const memberRecord = await base(TABLES.MASTERSHEET).find(
        recognition.memberOfTheMonth[0]
      );
      memberOfTheMonth = {
        id: memberRecord.id,
        name: `${memberRecord.get("Preferred Name") || ""} ${
          memberRecord.get("Last Name") || ""
        }`.trim(),
        headshot: memberRecord.get("Headshot")
          ? memberRecord.get("Headshot")[0].url
          : "",
        recognitionReason: recognition.recognitionReason,
      };
    }

    console.log("All Airtable data fetched successfully");
    return {
      members,
      kudos,
      activities,
      signedInMembers,
      memberTypes,
      messages,
      memberOfTheMonth,
    };
  } catch (error) {
    console.error("Error fetching all Airtable data:", error);
    throw error;
  }
}

module.exports = {
  findMember,
  getAllActiveMembers,
  signIn,
  signOut,
  createKudos,
  getAllKudos,
  getKudosStats,
  getMemberTypes,
  getAllMemberTypes,
  logActivity,
  getActivities,
  createMessage,
  getMessages,
  getAllMessages,
  markMessageAsRead,
  getForgeLevels,
  getMonthlyRecognition,
  testMastersheetAccess,
  listTables,
  testActivitiesAccess,
  testMemberTypesAccess,
  getSignedInMembers,
  syncWithAirtable,
  signOutAllMembers,
  getAllMemberData,
  getAllAirtableData,
};
