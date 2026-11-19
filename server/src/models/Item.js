
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Untitled"
    },

    type: {
      type: String,
      enum: ["note", "url"],
      required: true
    },

    content: {
      type: String,
      required: true
    },

    sourceUrl: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ["processing", "pending_embedding", "completed", "failed"],
      default: "processing"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Item", itemSchema);
