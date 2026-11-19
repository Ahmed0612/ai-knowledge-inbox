
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
dotenv.config();
const connectDB = require("./config/db");
const ingestionRoutes = require("./routes/ingestionRoutes")
const {
  recoverPendingEmbeddings
} = require("./services/embeddingRecovery.service");
const queryRoutes = require("./routes/queryRoutes");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/ingest", ingestionRoutes);
app.use("/api/query", queryRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Knowledge Inbox API is running"
  });
});

const startServer = async () => {
  try {
    // 1. Connect to MongoDB first.
    await connectDB();

    const PORT = process.env.PORT || 5000;

    // 2. Start accepting API requests.
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // 3. Recover interrupted embedding jobs in the background.
      recoverPendingEmbeddings().catch((error) => {
        console.error(
          "Embedding startup recovery failed:",
          error.message
        );
      });
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("Unexpected server error:", error.message);
  process.exit(1);
});
