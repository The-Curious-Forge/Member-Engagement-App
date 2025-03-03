const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { port, corsOrigin } = require("./config/config");

const signInRoutes = require("./routes/signIn");
const signOutRoutes = require("./routes/signOut");
const kudosRoutes = require("./routes/kudos");
const notificationsRoutes = require("./routes/notifications");
const activitiesRoutes = require("./routes/activities");
const membersRoutes = require("./routes/members");
const systemRoutes = require("./routes/system");
const messageRoutes = require("./routes/messages");
const airtableRoutes = require("./routes/airtable");
const alertsRoutes = require("./routes/alerts");
const calendarRoutes = require("./routes/calendar");
const mentorsRoutes = require("./routes/mentors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Pass io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configure routes
app.use("/api/signIn", signInRoutes);
app.use("/api/signOut", signOutRoutes);
app.use("/api/kudos", kudosRoutes);
app.use("/api", notificationsRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/airtable", airtableRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/mentors", mentorsRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("error", (err) => console.error("Socket error:", err));
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = { app, io };
