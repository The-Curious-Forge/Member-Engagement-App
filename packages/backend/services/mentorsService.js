const { base, TABLES } = require("./airtableClient");

async function getMentors() {
  try {
    const records = await base(TABLES.MENTORS).select().all();
    const mentorIds = records
      .map((record) => {
        const mentor = record.get("Mentor");
        return mentor && mentor.length > 0 ? mentor[0] : null;
      })
      .filter(Boolean); // Remove null values

    if (mentorIds.length === 0) {
      return []; // Return empty array if no valid mentor IDs
    }

    // Get mentor details from mastersheet
    const memberRecords = await base(TABLES.MASTERSHEET)
      .select({
        filterByFormula: `OR(${mentorIds
          .map((id) => `RECORD_ID()='${id}'`)
          .join(",")})`,
      })
      .all();

    const memberMap = new Map(
      memberRecords.map((record) => [
        record.id,
        {
          name: `${record.get("Preferred Name") || ""} ${
            record.get("Last Name") || ""
          }`.trim(),
          headshot: record.get("Headshot") ? record.get("Headshot")[0].url : "",
        },
      ])
    );

    return records
      .map((record) => {
        const mentor = record.get("Mentor");
        if (!mentor || mentor.length === 0) return null;

        const mentorId = mentor[0];
        const memberInfo = memberMap.get(mentorId) || {};

        return {
          id: record.id,
          mentorId: mentorId,
          name: memberInfo.name,
          headshot: memberInfo.headshot,
          expertise: record.get("Area") || "",
          available: true, // TODO: Implement availability logic
          email: record.get("Email"),
          phone: record.get("Number"),
        };
      })
      .filter(Boolean); // Remove null values
  } catch (error) {
    console.error("Error fetching mentors:", error);
    throw error;
  }
}

async function getMentorById(id) {
  try {
    const record = await base(TABLES.MENTORS).find(id);
    if (!record) return null;

    const mentor = record.get("Mentor");
    if (!mentor || mentor.length === 0) return null;

    const mentorId = mentor[0];
    const memberRecord = await base(TABLES.MASTERSHEET).find(mentorId);
    if (!memberRecord) return null;

    return {
      id: record.id,
      mentorId: mentorId,
      name: `${memberRecord.get("Preferred Name") || ""} ${
        memberRecord.get("Last Name") || ""
      }`.trim(),
      headshot: memberRecord.get("Headshot")
        ? memberRecord.get("Headshot")[0].url
        : "",
      expertise: record.get("Area") || "",
      available: true, // TODO: Implement availability logic
      email: record.get("Email"),
      phone: record.get("Number"),
    };
  } catch (error) {
    console.error("Error fetching mentor:", error);
    throw error;
  }
}

module.exports = {
  getMentors,
  getMentorById,
};
