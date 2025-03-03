const { base, TABLES } = require("./airtableClient");
const messagesService = require("./messagesService");
const kudosService = require("./kudosService");
const activitiesService = require("./activitiesService");
const systemService = require("./systemService");

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
  const [records, forgeLevels] = await Promise.all([
    base(TABLES.MASTERSHEET).select({ view: "Sign-in App" }).all(),
    base(TABLES.FORGE_LEVELS).select().all(),
  ]);
  const forgeLevelMap = new Map(
    forgeLevels.map((level) => [level.id, level.get("Level Name")])
  );
  const members = records.map((record) => {
    const forgeLevel = record.get("ForgeLevel");
    const forgeLevelName =
      forgeLevel && forgeLevel.length > 0
        ? forgeLevelMap.get(forgeLevel[0]) || "Novice"
        : "Novice";
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
      updatedQualifications: record.get("updatedQualifications") || "",
    };
  });
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
  const signInRecord = await base(TABLES.SIGNED_IN).find(signInRecordId);
  await base(TABLES.SIGNED_IN).destroy(signInRecordId);
  const useLogRecord = await base(TABLES.USE_LOG).create({
    Member: signInRecord.get("Member"),
    SignInTime: signInRecord.get("SignInTime"),
    SignOutTime: new Date().toISOString(),
    SignedInAs: signInRecord.get("SignedInType"),
  });
  return useLogRecord.id;
}

async function getMemberTypes(memberId) {
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
  return records.map((record) => ({
    id: record.id,
    group: record.get("Group"),
    sortingOrder: record.get("SortingOrder"),
  }));
}

async function getAllMemberTypes() {
  const records = await base(TABLES.MEMBER_TYPES)
    .select({ filterByFormula: "{Show Sign In Option}" })
    .all();
  return records.map((record) => ({
    id: record.id,
    group: record.get("Group"),
    sortingOrder: record.get("SortingOrder"),
  }));
}

async function getSignedInMembers() {
  const records = await base(TABLES.SIGNED_IN)
    .select({ filterByFormula: "{SignOutTime} = BLANK()" })
    .all();

  const memberTypeRecords = await base(TABLES.MEMBER_TYPES).select().all();
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

  const memberIds = records
    .map((record) => {
      const member = record.get("Member");
      return member && member.length > 0 ? member[0] : null;
    })
    .filter((id) => id !== null);

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

  return records.map((record) => {
    const memberId =
      record.get("Member") && record.get("Member").length > 0
        ? record.get("Member")[0]
        : null;
    const memberInfo = memberId ? memberMap.get(memberId) : null;
    return {
      ...memberInfo,
      signInRecordId: record.id,
      signInTime: record.get("SignInTime"),
      signedInType:
        record.get("SignedInType") && record.get("SignedInType").length > 0
          ? record.get("SignedInType")[0]
          : null,
      currentMemberType:
        record.get("SignedInType") && record.get("SignedInType").length > 0
          ? memberTypeMap.get(record.get("SignedInType")[0]) || null
          : null,
    };
  });
}

async function signOutAllMembers() {
  const signedInRecords = await base(TABLES.SIGNED_IN).select().all();
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
  return { success: true, message: "All members have been signed out" };
}

async function getMemberActivityHistory(memberId) {
  const records = await base(TABLES.USE_LOG)
    .select({ filterByFormula: `{Member} = '${memberId}'` })
    .all();

  const activityTimes = new Map();

  for (const record of records) {
    const signInTime = new Date(record.get("SignInTime")).getTime();
    const signOutTime = new Date(record.get("SignOutTime")).getTime();
    const signedInType = record.get("SignedInAs")?.[0];

    if (signInTime && signOutTime && signedInType) {
      const timeDiff = signOutTime - signInTime;
      const memberTypeRecord = await base(TABLES.MEMBER_TYPES).find(
        signedInType
      );
      const activity = memberTypeRecord.get("Group");

      if (activity) {
        const currentTotal = activityTimes.get(activity) || 0;
        activityTimes.set(activity, currentTotal + timeDiff);
      }
    }
  }

  const sortedActivities = Array.from(activityTimes.entries())
    .sort(([, timeA], [, timeB]) => timeB - timeA)
    .slice(0, 5)
    .map(([activity, time]) => ({ activity, time }));

  return sortedActivities;
}

async function getAllMemberData() {
  const members = await getAllActiveMembers();
  const [allMessages, allMemberTypes, signedInMembers, allKudos] =
    await Promise.all([
      messagesService.getAllMessages(),
      getAllMemberTypes(),
      getSignedInMembers(),
      kudosService.getAllKudos(),
    ]);
  const membersWithData = members.map((member) => {
    const memberMessages = allMessages.filter(
      (msg) => msg.member && msg.member.includes(member.id)
    );
    const memberTypes = member.memberTypes
      .map((typeId) => allMemberTypes.find((type) => type.id === typeId))
      .filter(Boolean);
    const isSignedIn = signedInMembers.some((s) => s.id === member.id);
    const kudosGiven = allKudos.filter((kudos) =>
      kudos.from.some((sender) => sender.id === member.id)
    );
    const kudosReceived = allKudos.filter((kudos) =>
      kudos.to.some((recipient) => recipient.id === member.id)
    );
    return {
      ...member,
      messages: memberMessages,
      memberTypes,
      isSignedIn,
      kudosGiven,
      kudosReceived,
    };
  });
  return membersWithData;
}

async function getAllAirtableData() {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    console.log("Getting all Airtable data for month:", currentMonth);

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
      kudosService.getAllKudos(),
      activitiesService.getActivities(),
      getSignedInMembers(),
      getAllMemberTypes(),
      messagesService.getAllMessages(),
      systemService.getMonthlyRecognition(currentMonth),
    ]);

    console.log("Monthly recognition data:", monthlyRecognition);

    let memberOfTheMonth = null;
    if (monthlyRecognition.length > 0) {
      const recognition = monthlyRecognition[0];
      console.log("Processing recognition record:", recognition);

      if (recognition.memberOfTheMonth) {
        try {
          const memberRecord = await base(TABLES.MASTERSHEET).find(
            recognition.memberOfTheMonth
          );
          console.log("Found member record:", memberRecord.id);

          memberOfTheMonth = {
            id: memberRecord.id,
            name: `${memberRecord.get("Preferred Name") || ""} ${
              memberRecord.get("Last Name") || ""
            }`.trim(),
            headshot: memberRecord.get("Headshot")
              ? memberRecord.get("Headshot")[0].url
              : "",
            recognitionReason: recognition.recognitionReason,
            projectOfTheMonth: recognition.projectOfTheMonth,
            projectDescription: recognition.projectDescription,
            projectPhotos: recognition.projectPhotos,
            projectMembers: await Promise.all(
              (recognition.projectMembers || []).map(async (memberId) => {
                try {
                  const memberRecord = await base(TABLES.MASTERSHEET).find(
                    memberId
                  );
                  return {
                    id: memberRecord.id,
                    name: `${memberRecord.get("Preferred Name") || ""} ${
                      memberRecord.get("Last Name") || ""
                    }`.trim(),
                    headshot: memberRecord.get("Headshot")
                      ? memberRecord.get("Headshot")[0].url
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
            ).then((members) => members.filter(Boolean)), // Remove any null members
          };
          console.log("Processed member of the month:", memberOfTheMonth);
        } catch (error) {
          console.error("Error processing member of the month:", error);
        }
      } else {
        console.log("No member of the month found in recognition record");
      }
    }

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
    console.error("Error in getAllAirtableData:", error);
    throw error;
  }
}

module.exports = {
  findMember,
  getAllActiveMembers,
  signIn,
  signOut,
  getMemberTypes,
  getAllMemberTypes,
  getSignedInMembers,
  signOutAllMembers,
  getAllMemberData,
  getMemberActivityHistory,
  getAllAirtableData,
  getMonthlyRecognition: systemService.getMonthlyRecognition,
};
