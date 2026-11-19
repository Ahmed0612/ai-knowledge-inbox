# AI Knowledge Inbox

A lightweight AI-powered knowledge management application built using the MERN stack and Retrieval-Augmented Generation (RAG). Users can save notes and web URLs, process and embed their content, and ask questions to retrieve context-aware answers with source references.

## Features

- **Save knowledge:** Ingest plain-text notes and webpage URLs.
- **URL extraction:** Fetch and extract webpage content on the backend.
- **Content processing:** Split documents into manageable chunks.
- **AI embeddings:** Generate vector embeddings using Ollama.
- **Semantic retrieval:** Retrieve relevant knowledge chunks using cosine similarity.
- **AI question answering:** Generate answers using retrieved context.
- **Source references:** Return source information and relevant content alongside answers.
- **Persistent storage:** Store items, chunks, metadata, and embeddings in MongoDB.

## Technology Stack

### Frontend
- React
- Vite
- Redux Toolkit
- React Redux
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Axios
- Cheerio

### Local AI
- Ollama
- `nomic-embed-text` — text embedding model
- `qwen2.5:1.5b` — answer generation model

## Architecture

```text
React Frontend
      |
      | REST API
      v
Express Backend
      |
      +---- Ingestion Service
      |        |
      |        +---- Note / URL extraction
      |        +---- Text chunking
      |        +---- Embedding generation
      |
      +---- Query Service
               |
               +---- Question embedding
               +---- Semantic retrieval
               +---- Context construction
               +---- LLM answer generation
      |
      v
MongoDB Atlas

Ollama
  +---- nomic-embed-text
  +---- qwen2.5:1.5b
```

## RAG Workflow

1. A user submits a text note or webpage URL.
2. The backend extracts or accepts the content.
3. The content is divided into smaller chunks.
4. Each chunk is converted into a vector embedding using Ollama.
5. The item, chunks, metadata, and embeddings are stored in MongoDB.
6. When a user asks a question, the backend generates an embedding for the question.
7. Cosine similarity is calculated against stored embeddings to retrieve the most relevant chunks.
8. Retrieved context is passed to the local language model.
9. The generated answer and source references are returned to the frontend.

## API Endpoints

All backend routes use the `/api` prefix.

### Knowledge Ingestion

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/ingest` | Create a knowledge item from a note or URL |
| GET | `/api/ingest` | Retrieve saved knowledge items |
| GET | `/api/ingest/:id` | Retrieve a specific knowledge item |
| DELETE | `/api/ingest/:id` | Delete a knowledge item |
| POST | `/api/ingest/:id/retry-embeddings` | Retry embedding processing for an item |

### AI Query

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/query` | Ask a question using RAG and retrieve source references |

## Project Structure

```text
ai-knowledge-inbox/
+-- client/
¦   +-- src/
¦   ¦   +-- app/
¦   ¦   +-- features/
¦   ¦   +-- services/
¦   ¦   +-- App.jsx
¦   ¦   +-- main.jsx
¦   +-- package.json
¦
+-- server/
¦   +-- src/
¦   ¦   +-- config/
¦   ¦   +-- controllers/
¦   ¦   +-- models/
¦   ¦   +-- routes/
¦   ¦   +-- services/
¦   ¦   +-- server.js
¦   +-- package.json
¦
+-- README.md
```

## Prerequisites

- Node.js 20 or later
- npm
- MongoDB Atlas account or accessible MongoDB instance
- Ollama installed locally

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Ahmed0612/ai-knowledge-inbox.git
cd ai-knowledge-inbox
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_GENERATION_MODEL=qwen2.5:1.5b
OLLAMA_TIMEOUT=120000
EMBEDDING_DIMENSIONS=768
```

Replace the MongoDB value with your own connection string.

### 3. Install Ollama models

Install Ollama from:

https://ollama.com/

Pull the required models:

```bash
ollama pull nomic-embed-text
ollama pull qwen2.5:1.5b
```

Ensure Ollama is running locally.

### 4. Start the backend

From the `server` directory:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Configure the frontend

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 6. Start the frontend

From the `client` directory:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## Design Decisions and Trade-offs

### Local AI models

Ollama is used to run embedding and generation models locally. This avoids depending on paid external AI APIs and keeps model inference within the local environment.

The selected models provide a lightweight setup suitable for demonstrating the RAG workflow, although smaller models may produce less accurate or detailed answers than larger models.

### MongoDB storage

MongoDB stores knowledge items, chunks, metadata, and embeddings. This provides a simple persistent storage solution for the assessment.

### In-process semantic retrieval

Cosine similarity is calculated in the Node.js application instead of relying on a managed vector database or Atlas Vector Search. This keeps the implementation lightweight and suitable for a small assessment dataset.

This approach requires loading and comparing stored embeddings in application code, so it is not intended for large-scale retrieval workloads.

### Asynchronous embedding processing

Embedding processing is separated from the initial ingestion flow. Processing status and recovery handling help manage pending or interrupted embedding jobs.

## Current Limitations and Future Improvements

- In-process vector comparison is suitable for small datasets but does not scale efficiently to large collections.
- Smaller local language models may have limitations in reasoning and answer quality.
- A production system could use a dedicated vector database or MongoDB Atlas Vector Search.
- A persistent background job queue could improve embedding processing reliability at scale.
- Automated tests, monitoring, and stronger operational safeguards could be expanded for production deployment.

## Security Notes

- Environment files and credentials must not be committed to Git.
- Keep MongoDB connection strings private.
- Ollama is configured for local inference by default.
- Do not expose local AI services publicly without appropriate access controls.

## License

This project was created as part of a technical recruitment assessment for Turium AI.