const { google } = require("googleapis");

class CalendarService {
  constructor() {
    this.calendar = google.calendar({
      version: "v3",
      auth: process.env.GOOGLE_API_KEY,
    });
    this.calendarId = process.env.GOOGLE_CALENDAR_ID;
  }

  async getEvents() {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: new Date(
          new Date().setDate(new Date().getDate() - 7)
        ).toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items;
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      throw error;
    }
  }
}

module.exports = new CalendarService();
