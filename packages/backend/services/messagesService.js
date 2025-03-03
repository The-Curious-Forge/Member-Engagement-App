const { base, TABLES } = require("./airtableClient");

async function createMessage(message, memberId = null, isImportant = false) {
  const record = await base(TABLES.RECEIVED_MESSAGES).create({
    Message: message,
    "Message Date": new Date().toISOString(),
    Member: memberId ? [memberId] : null,
    Important: isImportant,
  });
  return record.id;
}

async function getMessages(memberId, limit = 10) {
  const query = { sort: [{ field: "Message Date", direction: "desc" }] };
  const records = await base(TABLES.ALL_MESSAGES).select(query).all();
  const filteredRecords = records.filter((record) => {
    const memberIds = record.get("Member") || [];
    return memberIds.includes(memberId);
  });
  return filteredRecords.slice(0, limit).map((record) => ({
    id: record.id,
    content: record.get("Message")?.toString() || "",
    messageDate: record.get("Message Date"),
    readDate: record.get("Read Date"),
    important: record.get("Important"),
    appNotification: record.get("App Notification"),
    member: record.get("Member"),
    read: !!record.get("Read Date"),
    attachment: record.get("Attachment")?.[0]?.url || null,
    qrLink: record.get("QRLink") || null,
  }));
}

async function getAllMessages() {
  const query = { sort: [{ field: "Message Date", direction: "desc" }] };
  const records = await base(TABLES.ALL_MESSAGES).select(query).all();
  return records.map((record) => ({
    id: record.id,
    content: record.get("Message")?.toString() || "",
    messageDate: record.get("Message Date"),
    readDate: record.get("Read Date"),
    important: record.get("Important"),
    appNotification: record.get("App Notification"),
    member: record.get("Member"),
    read: !!record.get("Read Date"),
    attachment: record.get("Attachment")?.[0]?.url || null,
    qrLink: record.get("QRLink") || null,
  }));
}

async function markMessageAsRead(messageId) {
  const record = await base(TABLES.ALL_MESSAGES).update(messageId, {
    "Read Date": new Date().toISOString(),
  });

  // Return the updated message data
  return {
    id: record.id,
    content: record.get("Message")?.toString() || "",
    messageDate: record.get("Message Date"),
    readDate: record.get("Read Date"),
    important: record.get("Important"),
    appNotification: record.get("App Notification"),
    member: record.get("Member"),
    read: true,
    attachment: record.get("Attachment")?.[0]?.url || null,
    qrLink: record.get("QRLink") || null,
  };
}

async function getAppNotifications() {
  const query = {
    filterByFormula: "{App Notification}=1",
    sort: [{ field: "Message Date", direction: "desc" }],
  };
  const records = await base(TABLES.ALL_MESSAGES).select(query).all();
  const now = new Date();
  return records
    .map((record) => {
      const expirationDate = record.get("Expiration Date");
      // If there's no expiration date or the alert hasn't expired yet, include it
      if (!expirationDate || new Date(expirationDate) > now) {
        return {
          id: record.id,
          content: record.get("Message")?.toString() || "",
          messageDate: record.get("Message Date"),
          important: record.get("Important"),
          type: record.get("Important") ? "warning" : "info",
          expirationDate: expirationDate || null,
          source: "airtable",
          attachment: record.get("Attachment")?.[0]?.url || null,
          qrLink: record.get("QRLink") || null,
        };
      }
      return null;
    })
    .filter(Boolean); // Remove null entries (expired alerts)
}

module.exports = {
  createMessage,
  getMessages,
  getAllMessages,
  markMessageAsRead,
  getAppNotifications,
};
