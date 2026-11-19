
const Chunk = require("../models/Chunk");
const Item = require("../models/Item");

const generateEmbedding = require("./embedding.service");

const {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS
} = require("../config/ai.config");

// Ollama request timeout is 120 seconds.
// Keep the lease longer than that to avoid reclaiming active work.
const PROCESSING_LEASE_MS = 3 * 60 * 1000;

const processItemEmbeddings = async (
  itemId,
  { retryFailed = false } = {}
) => {
  const item = await Item.findById(itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  await Item.findByIdAndUpdate(itemId, {
    status: "pending_embedding"
  });

  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0
  };

  const staleBefore = new Date(Date.now() - PROCESSING_LEASE_MS);

  // Only pending chunks are normally eligible.
  const eligibleConditions = [
    { embeddingStatus: "pending" },

    // Support older chunks created before embeddingStatus existed.
    {
      embeddingStatus: { $exists: false },
      embedding: { $size: 0 }
    },
    {
      embeddingStatus: null,
      embedding: { $size: 0 }
    },

    // Recover work abandoned by a crashed or stopped worker.
    {
      embeddingStatus: "processing",
      processingStartedAt: { $lt: staleBefore }
    }
  ];

  // Failed chunks are retried only on an explicit retry request.
  if (retryFailed) {
    eligibleConditions.push({
      embeddingStatus: "failed"
    });
  }

  while (true) {
    const claimedAt = new Date();

    // Atomically claim the next eligible chunk.
    const chunk = await Chunk.findOneAndUpdate(
      {
        itemId,
        $or: eligibleConditions
      },
      {
        $set: {
          embeddingStatus: "processing",
          processingStartedAt: claimedAt,
          embeddingError: null
        }
      },
      {
        returnDocument: "after",
        sort: { chunkIndex: 1 }
      }
    );

    if (!chunk) {
      break;
    }

    stats.processed += 1;

    try {
      console.log(
        `Generating embedding for item ${itemId}, chunk ${chunk.chunkIndex}`
      );

      const embedding = await generateEmbedding(chunk.content);

      if (
        !Array.isArray(embedding) ||
        embedding.length !== EMBEDDING_DIMENSIONS ||
        !embedding.every(
          (value) => typeof value === "number" && Number.isFinite(value)
        )
      ) {
        throw new Error("Invalid embedding response");
      }

      const result = await Chunk.updateOne(
        {
          _id: chunk._id,
          embeddingStatus: "processing",
          processingStartedAt: claimedAt
        },
        {
          $set: {
            embedding,
            embeddingStatus: "completed",
            embeddingModel: EMBEDDING_MODEL,
            embeddedAt: new Date(),
            embeddingError: null,
            processingStartedAt: null
          }
        }
      );

      if (result.modifiedCount === 1) {
        stats.succeeded += 1;

        console.log(
          `Chunk ${chunk.chunkIndex} embedded successfully`
        );
      }
    } catch (error) {
      console.error(
        `Embedding failed for chunk ${chunk.chunkIndex}:`,
        error.message
      );

      const result = await Chunk.updateOne(
        {
          _id: chunk._id,
          embeddingStatus: "processing",
          processingStartedAt: claimedAt
        },
        {
          $set: {
            embeddingStatus: "failed",
            embeddingError: String(error.message).slice(0, 500),
            embedding: [],
            embeddedAt: null,
            processingStartedAt: null
          }
        }
      );

      if (result.modifiedCount === 1) {
        stats.failed += 1;
      }
    }
  }

  // Recalculate the parent Item status from its current chunk states.
  const [
    totalChunks,
    completedChunks,
    failedChunks,
    processingChunks,
    pendingChunks
  ] = await Promise.all([
    Chunk.countDocuments({ itemId }),

    Chunk.countDocuments({
      itemId,
      embeddingStatus: "completed",
      embeddingModel: EMBEDDING_MODEL
    }),

    Chunk.countDocuments({
      itemId,
      embeddingStatus: "failed"
    }),

    Chunk.countDocuments({
      itemId,
      embeddingStatus: "processing"
    }),

    Chunk.countDocuments({
      itemId,
      $or: [
        { embeddingStatus: "pending" },
        { embeddingStatus: { $exists: false } },
        { embeddingStatus: null }
      ]
    })
  ]);

  let finalStatus = "pending_embedding";

  if (totalChunks > 0 && completedChunks === totalChunks) {
    finalStatus = "completed";
  } else if (processingChunks > 0 || pendingChunks > 0) {
    finalStatus = "pending_embedding";
  } else if (failedChunks > 0) {
    finalStatus = "failed";
  }

  await Item.findByIdAndUpdate(itemId, {
    status: finalStatus
  });

  console.log(
    `Item ${itemId} embedding status: ${finalStatus}`
  );

  return {
    itemId,
    totalChunks,
    completedChunks,
    failedChunks,
    processingChunks,
    pendingChunks,
    status: finalStatus,
    stats
  };
};

module.exports = {
  processItemEmbeddings
};
