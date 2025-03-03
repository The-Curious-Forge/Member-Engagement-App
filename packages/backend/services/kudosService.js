const { base, TABLES } = require("./airtableClient");

async function createKudos(from, to, message) {
  const record = await base(TABLES.KUDOS).create({
    From: from ? [from] : null,
    To: to,
    Message: message,
    Date: new Date().toISOString(),
  });
  const [fromMember] = from
    ? await base(TABLES.MASTERSHEET)
        .select({ filterByFormula: `RECORD_ID() = '${from}'` })
        .firstPage()
    : [];
  const toMembersPromises = to.map((id) =>
    base(TABLES.MASTERSHEET)
      .select({ filterByFormula: `RECORD_ID() = '${id}'` })
      .firstPage()
  );
  const toMembersArray = await Promise.all(toMembersPromises);
  return {
    id: record.id,
    from: from
      ? [
          {
            id: from,
            name: fromMember
              ? `${fromMember.get("Preferred Name")} ${fromMember.get(
                  "Last Name"
                )}`.trim()
              : "Unknown",
          },
        ]
      : [],
    to: toMembersArray.map((records) => {
      const rec = records[0];
      return {
        id: rec.id,
        name: `${rec.get("Preferred Name")} ${rec.get("Last Name")}`.trim(),
      };
    }),
    message,
    date: record.get("Date"),
  };
}

async function getAllKudos() {
  const kudosRecords = await base(TABLES.KUDOS)
    .select({ sort: [{ field: "Date", direction: "desc" }] })
    .all();
  const memberIds = new Set();
  kudosRecords.forEach((record) => {
    (record.get("From") || []).forEach((id) => memberIds.add(id));
    (record.get("To") || []).forEach((id) => memberIds.add(id));
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
      `${record.get("Preferred Name")} ${record.get("Last Name")}`.trim(),
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
  let kudosGiven = 0,
    kudosReceived = 0;
  kudosRecords.forEach((record) => {
    const fromIds = record.get("From") || [];
    const toIds = record.get("To") || [];
    if (fromIds.includes(memberId)) kudosGiven++;
    if (toIds.includes(memberId)) kudosReceived++;
  });
  return { kudosGiven, kudosReceived };
}

module.exports = {
  createKudos,
  getAllKudos,
  getKudosStats,
};
