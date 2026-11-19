
const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true
    },

    content: {
      type: String,
      required: true
    },

    chunkIndex: {
      type: Number,
      required: true
    },

    embedding: {
      type: [Number],
      default: []
    },
    embeddingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true
    },
    // Records when a worker claimed this chunk.
    // Used to identify interrupted processing.
    processingStartedAt: {
      type: Date,
      default: null
    },
    embeddingModel: {
      type: String,
      default: null
    },
    embeddedAt: {
      type: Date,
      default: null
    },
    embeddingError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Chunk", chunkSchema);
