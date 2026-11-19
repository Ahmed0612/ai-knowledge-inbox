
const {
  retrieveRelevantChunks
} = require("../services/retrieval.service");
const generateAnswer = require("../services/llm.service");

const queryKnowledge = async (req, res) => {
  let stage = "validation";
  try {
    const { question, topK = 5 } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Question is required"
      });
    }

    if (
      !Number.isInteger(topK) ||
      topK < 1 ||
      topK > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "topK must be an integer between 1 and 10"
      });
    }

    // 1. Retrieve relevant knowledge chunks.
    stage = "retrieval";
    const results = await retrieveRelevantChunks(
      question.trim(),
      topK
    );

      // 2. Generate an answer using retrieved context.
      stage = "generation";
      const answer = await generateAnswer(
          question.trim(),
          results
      );

      // 3. Prepare source references.
      stage = "source_mapping";
      const sources = results.map((chunk, index) => ({
          sourceNumber: index + 1,
          chunkId: chunk.chunkId,
          title: chunk.source.title,
          type: chunk.source.type,
          sourceUrl: chunk.source.sourceUrl,
          chunkIndex: chunk.chunkIndex,
          similarity: chunk.similarity,
          content: chunk.content
      }));

      return res.status(200).json({
          success: true,
          question: question.trim(),
          answer,
          totalResults: results.length,
          sources
      });

  } catch (error) {
    console.error("Knowledge query failed:", {
      stage,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: "Unable to process your question"
    });
  }
};

module.exports = {
  queryKnowledge
};
