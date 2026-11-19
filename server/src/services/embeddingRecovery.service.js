
const Item = require("../models/Item");
const Chunk = require("../models/Chunk");

const {
  processItemEmbeddings
} = require("./embeddingProcessor.service");

const recoverPendingEmbeddings = async () => {
  console.log("Checking for pending embedding jobs...");

  const pendingItems = await Item.find({
    status: "pending_embedding"
  })
    .select("_id")
    .sort({ createdAt: 1 })
    .lean();

  if (pendingItems.length === 0) {
    console.log("No pending embedding jobs found.");
    return;
  }

  console.log(
    `Found ${pendingItems.length} pending item(s). Starting recovery...`
  );

  for (const item of pendingItems) {
    try {
      // A processing chunk was interrupted by the previous
      // server process. Reset it so the processor can claim it.
      await Chunk.updateMany(
        {
          itemId: item._id,
          embeddingStatus: "processing"
        },
        {
          $set: {
            embeddingStatus: "pending",
            processingStartedAt: null,
            embeddingError: null
          }
        }
      );

      // Resume this item's pending chunks.
      const result = await processItemEmbeddings(item._id);

      console.log(
        `Recovery finished for item ${item._id}: ${result.status}`
      );

    } catch (error) {
      console.error(
        `Recovery failed for item ${item._id}:`,
        error.message
      );
    }
  }

  console.log("Pending embedding recovery finished.");
};

module.exports = {
  recoverPendingEmbeddings
};
