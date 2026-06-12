const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const priorityRoutes = require("./routes/priorityRoutes");
const statusRoutes = require("./routes/statusRoutes");
const tagRoutes = require("./routes/tagRoutes");
const dashboardRoutes =
require("./routes/dashboardRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/categories", categoryRoutes);
app.use("/api/priorities", priorityRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/dashboard",dashboardRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
module.exports = app;
