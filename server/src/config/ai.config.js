
require("dotenv").config();

const OLLAMA_BASE_URL = (
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
).replace(/\/+$/, "");

const EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

const GENERATION_MODEL =
  process.env.OLLAMA_GENERATION_MODEL || "qwen2.5:1.5b";

const EMBEDDING_DIMENSIONS = Number(
  process.env.EMBEDDING_DIMENSIONS || 768
);

const OLLAMA_TIMEOUT = Number(
  process.env.OLLAMA_TIMEOUT || 120000
);

module.exports = {
  OLLAMA_BASE_URL,
  EMBEDDING_MODEL,
  GENERATION_MODEL,
  EMBEDDING_DIMENSIONS,
  OLLAMA_TIMEOUT
};
