require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const signInRoutes = require("./signIn");
const signOutRoutes = require("./signOut");
const kudosRoutes = require("./kudos");
const notificationsRoutes = require("./notifications");
const activityRoutes = require("./routes/activityRoutes");
const memberRoutes = require("./routes/memberRoutes");
const systemRoutes = require("./routes/systemRoutes");
const messageRoutes = require("./routes/messageRoutes");
const airtableRoutes = require("./routes/airtableRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
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
app.use("/api/activities", activityRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/airtable", airtableRoutes);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
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

module.exports = { app, io };
