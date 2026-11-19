const mongoose = require("mongoose");
const Item = require("../models/Item");
const Chunk = require("../models/Chunk");
const splitIntoChunks = require("../services/chunkingService");
const extractWebpageContent = require("../services/urlExtractionService");
const {
    processItemEmbeddings
} = require("../services/embeddingProcessor.service");

// Run embedding generation outside the ingestion request.
const scheduleEmbeddingProcessing = (itemId, options = {}) => {
    setImmediate(() => {
        processItemEmbeddings(itemId, options).catch((error) => {
            console.error(
                `Background embedding processing failed for item ${itemId}:`,
                error.message
            );
        });
    });
};

const ingestContent = async (req, res) => {
  let item;

  try {
    const { type, content, title } = req.body;

    // Validate request
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: "Type and content are required"
      });
    }

    if (!["note", "url"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either note or url"
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content must be a non-empty string"
      });
    }

    if (content.length > 100000) {
      return res.status(413).json({
        success: false,
        message: "Content exceeds the maximum allowed size"
      });
    }

      if (type === "url") {
          // Fetch and extract webpage content
          const extracted = await extractWebpageContent(content);

          // Create item using extracted webpage data
          item = await Item.create({
              type: "url",
              title: title?.trim() || extracted.title,
              content: extracted.content,
              sourceUrl: extracted.sourceUrl,
              status: "processing"
          });

          // Split extracted content into chunks
          const chunks = splitIntoChunks(extracted.content);

          // Prepare chunk documents
          const chunkDocuments = chunks.map((chunk, index) => ({
              itemId: item._id,
              content: chunk,
              chunkIndex: index,
              embedding: []
          }));

          // Save chunks
          await Chunk.insertMany(chunkDocuments);

          // Mark embeddings as pending
          item.status = "pending_embedding";
          await item.save();

           // Start embedding generation asynchronously.
           scheduleEmbeddingProcessing(item._id);

          return res.status(201).json({
              success: true,
              message: "Webpage ingested successfully. Embedding processing started.",
              data: {
                  itemId: item._id,
                  title: item.title,
                  type: item.type,
                  sourceUrl: item.sourceUrl,
                  status: item.status,
                  totalChunks: chunks.length,
                  contentLength: extracted.content.length,
                  createdAt: item.createdAt
              }
          });
      }

    // Save original item
    item = await Item.create({
      type,
      title: title?.trim() || "Untitled",
      content: content.trim(),
      status: "processing"
    });

    // Split content
    const chunks = splitIntoChunks(content);

    // Prepare chunk documents
    const chunkDocuments = chunks.map((chunk, index) => ({
      itemId: item._id,
      content: chunk,
      chunkIndex: index,
      embedding: []
    }));

    // Save chunks
    await Chunk.insertMany(chunkDocuments);

    item.status = "pending_embedding";
    await item.save();

    // Start embedding generation asynchronously.
    scheduleEmbeddingProcessing(item._id);

    return res.status(201).json({
      success: true,
      message: "Note ingested successfully. Embedding processing started.",
      data: {
        itemId: item._id,
        title: item.title,
        type: item.type,
        status: item.status,
        totalChunks: chunks.length,
        createdAt: item.createdAt
      }
    });

  } catch (error) {
    console.error("Content ingestion error:", error.message);

    if (item) {
      await Promise.all([
        Item.findByIdAndUpdate(item._id, {
          status: "failed"
        }),
        Chunk.deleteMany({ itemId: item._id })
      ]).catch((cleanupError) => {
        console.error("Ingestion cleanup failed:", cleanupError.message);
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to ingest content. Please try again."
    });
  }
};

const getItems = async (req, res) => {
    try {
        // Get pagination parameters
        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        // Fetch items and total count
        const [items, totalItems] = await Promise.all([
            Item.find()
                .select("title type sourceUrl status createdAt updatedAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Item.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            data: {
                items,
                pagination: {
                    currentPage: page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                }
            }
        });

    } catch (error) {
        console.error("Get items error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve items"
        });
    }
};

const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id: ", id)

    // 1. Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    // 2. Find item
    const item = await Item.findById(id)
      .select("-__v")
      .lean();

    // 3. Check whether item exists
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // 4. Retrieve associated chunks
    const chunks = await Chunk.find({
      itemId: item._id
    })
      .select("-embedding -__v")
      .sort({ chunkIndex: 1 })
      .lean();

    // 5. Return item and chunks
    return res.status(200).json({
      success: true,
      message: "Item retrieved successfully",
      data: {
        item,
        chunks,
        totalChunks: chunks.length
      }
    });

  } catch (error) {
    console.error("Get item by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve item"
    });
  }
};

const retryItemEmbeddings = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id) ||
            !/^[0-9a-fA-F]{24}$/.test(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID"
            });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        const failedChunks = await Chunk.countDocuments({
            itemId: id,
            embeddingStatus: "failed"
        });

        if (failedChunks === 0) {
            return res.status(409).json({
                success: false,
                message: "No failed chunks available for retry"
            });
        }

        await Item.findByIdAndUpdate(id, {
            status: "pending_embedding"
        });

        // Start retry processing outside the HTTP request.
        setImmediate(() => {
            processItemEmbeddings(id, { retryFailed: true })
                .catch((error) => {
                    console.error(
                        `Embedding retry failed for item ${id}:`,
                        error.message
                    );
                });
        });

        return res.status(202).json({
            success: true,
            message: "Embedding retry has been queued",
            data: {
                itemId: id,
                failedChunks,
                status: "pending_embedding"
            }
        });

    } catch (error) {
        console.error("Retry embedding error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retry embeddings"
        });
    }
};


const deleteItem = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        // 1. Validate MongoDB ObjectId
        if (
            !mongoose.Types.ObjectId.isValid(id) ||
            !/^[0-9a-fA-F]{24}$/.test(id)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID"
            });
        }

        let deletedChunksCount = 0;
        let itemFound = false;

        // 2. Execute deletions in a transaction
        await session.withTransaction(async () => {

            // Find item
            const item = await Item.findById(id).session(session);

            if (!item) {
                return;
            }

            itemFound = true;

            // Delete associated chunks
            const chunkResult = await Chunk.deleteMany(
                { itemId: item._id },
                { session }
            );

            deletedChunksCount = chunkResult.deletedCount;

            // Delete original item
            await Item.deleteOne(
                { _id: item._id },
                { session }
            );
        });

        // 3. Handle missing item
        if (!itemFound) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        // 4. Return success response
        return res.status(200).json({
            success: true,
            message: "Item and associated chunks deleted successfully",
            data: {
                itemId: id,
                deletedChunks: deletedChunksCount,
                deletedItem: true
            }
        });

    } catch (error) {
        console.error("Delete item error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete item"
        });

    } finally {
        await session.endSession();
    }
};


module.exports = {
  ingestContent,
  getItems,
  getItemById,
  retryItemEmbeddings,
  deleteItem
};
