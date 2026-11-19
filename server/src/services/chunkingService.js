
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

const splitIntoChunks = (content) => {
  if (!content || typeof content !== "string") {
    throw new Error("Content must be a non-empty string");
  }

  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error("Content cannot be empty");
  }

  const chunks = [];

  let start = 0;

  while (start < cleanContent.length) {
    const end = Math.min(
      start + CHUNK_SIZE,
      cleanContent.length
    );

    const chunk = cleanContent.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end === cleanContent.length) {
      break;
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
};

module.exports = splitIntoChunks;
