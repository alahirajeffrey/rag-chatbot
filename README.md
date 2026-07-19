# RAG Chatbot (Node.js + pgvector)

A minimal Retrieval-Augmented Generation (RAG) chatbot API.

It lets you:

- Upload a PDF and stores chunks in Postgres with vector embeddings.
- Ask questions and get answers grounded in the uploaded content.

## How It Works

1. **Ingestion**

- `POST /ingest` accepts a PDF file.
- The server extracts text with `pdf-parse`.
- Text is split into overlapping chunks (`500` chars, `50` overlap, small chunks removed).
- Each chunk is embedded with Gemini (`gemini-embedding-001`).
- Chunks + embeddings are stored in Postgres (`pgvector`).

2. **Chat / Retrieval**

- `POST /chat` accepts a question.
- The question is embedded with Gemini.
- Top 5 nearest chunks are retrieved with vector similarity (`<=>` in pgvector).
- Context is passed to Groq (`llama-3.1-8b-instant`) to generate the final answer.

## Tech Stack (Brief)

- **Node.js + Express**: REST API server
- **PostgreSQL + pgvector**: document and vector storage
- **multer**: PDF upload handling (in-memory)
- **pdf-parse**: text extraction from PDFs
- **Google Gemini Embeddings API**: text embeddings
- **Groq Chat Completions API**: answer generation
- **Docker Compose**: local Postgres setup
- **nodemon**: local development auto-reload

## Prerequisites

- Node.js 18+
- Docker Desktop (or local Postgres with pgvector installed)
- API keys:
- `GEMINI_API_KEY`
- `GROQ_API_KEY`

## Environment Variables

Create a `.env` file (or use `.env.example`) with values like:

```env
PORT=3001

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ragdb
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ragdb

GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
```

## Run Locally

1. Start Postgres with pgvector:

```bash
docker compose -f compose.yml up -d
```

2. Install dependencies:

```bash
npm install
```

3. Start the API:

```bash
npm run dev
```

The server runs on `http://localhost:3001` by default.

## API Documentation

### 1) Ingest PDF

**Endpoint**

- `POST /ingest`
- `Content-Type: multipart/form-data`
- Form field: `file` (PDF)

**Validation rules**

- Missing file -> `400` with `{ "error": "No file uploaded" }`
- Non-PDF upload -> `400` with `{ "error": "Only PDF files are supported" }`

**Example cURL**

```bash
curl -X POST http://localhost:3001/ingest \
  -F "file=@./sample.pdf"
```

**Success response (200)**

```json
{
  "message": "Ingested 12 chunks from \"sample.pdf\""
}
```

**Failure response (500)**

```json
{
  "error": "Ingestion failed",
  "detail": "<error message>"
}
```

---

### 2) Chat

**Endpoint**

- `POST /chat`
- `Content-Type: application/json`

**Request body**

```json
{
  "question": "What is the refund policy?"
}
```

**Validation rules**

- Missing or non-string `question` -> `400` with `{ "error": "question is required" }`

**Example cURL**

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Summarize the main points."}'
```

**Success response (200)**

```json
{
  "answer": "...model answer grounded in retrieved context...",
  "sources": ["sample.pdf"],
  "topSimilarity": "0.873"
}
```

**Empty retrieval fallback**

```json
{
  "answer": "No relevant documents found.",
  "sources": []
}
```

**Failure response (500)**

```json
{
  "error": "Query failed",
  "detail": "<error message>"
}
```

## Database Schema

The app initializes this table automatically at startup:

- `documents`
- `id UUID PRIMARY KEY`
- `content TEXT NOT NULL`
- `source TEXT NOT NULL`
- `embedding VECTOR(3072)`

## Notes

- Embedding dimension is fixed to `3072` for Gemini embeddings.
- Retrieval currently uses top `5` chunks.
