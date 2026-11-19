
const Chunk = require("../models/Chunk");
const generateEmbedding = require("./embedding.service");

const {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS
} = require("../config/ai.config");

const cosineSimilarity = (vectorA, vectorB) => {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length !== vectorB.length ||
    vectorA.length === 0
  ) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] ** 2;
    magnitudeB += vectorB[i] ** 2;
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
};

const retrieveRelevantChunks = async (question, topK = 5) => {
  if (typeof question !== "string" || !question.trim()) {
    throw new Error("A valid question is required");
  }

  const queryEmbedding = await generateEmbedding(question);

  const chunks = await Chunk.find({
    embeddingStatus: "completed",
    embeddingModel: EMBEDDING_MODEL
  })
    .select("itemId content chunkIndex embedding")
    .populate({
      path: "itemId",
      select: "title type sourceUrl createdAt"
    })
    .lean();

  const results = chunks
    .filter((chunk) => {
      return (
        Array.isArray(chunk.embedding) &&
        chunk.embedding.length === EMBEDDING_DIMENSIONS &&
        chunk.itemId
      );
    })
    .map((chunk) => ({
      chunkId: chunk._id,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      source: {
        itemId: chunk.itemId._id,
        title: chunk.itemId.title,
        type: chunk.itemId.type,
        sourceUrl: chunk.itemId.sourceUrl,
        createdAt: chunk.itemId.createdAt
      }
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
};

module.exports = {
  retrieveRelevantChunks,
  cosineSimilarity
};
