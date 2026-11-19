
const axios = require("axios");

const {
  OLLAMA_BASE_URL,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  OLLAMA_TIMEOUT
} = require("../config/ai.config");

const generateEmbedding = async (text) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Embedding text must be a non-empty string");
  }

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/embeddings`,
      {
        model: EMBEDDING_MODEL,
        prompt: text.trim()
      },
      {
        timeout: OLLAMA_TIMEOUT,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const embedding = response.data?.embedding;

    // Validate embedding response.
    if (!Array.isArray(embedding)) {
      throw new Error("Ollama returned an invalid embedding response");
    }

    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Invalid embedding dimensions. Expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`
      );
    }

    if (!embedding.every(
      (value) => typeof value === "number" && Number.isFinite(value)
    )) {
      throw new Error("Embedding contains invalid numeric values");
    }

    return embedding;

  } catch (error) {
    if (error.response) {
      console.error("Ollama API error:", error.response.status);
      throw new Error("Failed to generate embedding using Ollama");
    }

    if (error.code === "ECONNABORTED") {
      throw new Error("Ollama embedding request timed out");
    }

    if (error.code === "ECONNREFUSED") {
      throw new Error("Unable to connect to Ollama. Ensure Ollama is running.");
    }

    throw error;
  }
};

module.exports = generateEmbedding;
