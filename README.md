# Doc-Hunter

A semantic documentation search system powered by vector embeddings and AI. Doc-Hunter allows you to ingest documentation from any URL, store it with vector embeddings, and query it using natural language questions.

## Architecture

Doc-Hunter uses a **Retrieval-Augmented Generation (RAG)** architecture combining:

- **SurrealDB** - Vector database for storing document chunks with embeddings
- **Google Gemini API** - For generating embeddings and AI-powered answers
- **HNSW Index** - High-performance vector similarity search
- **Deno** - Modern, secure JavaScript/TypeScript runtime

### Architecture Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ Commands (init/ingest/ask)
       │
┌──────▼──────────────────────────────────────────────┐
│              main.ts (CLI Entry Point)              │
└──────┬──────────────────────────────────────────────┘
       │
       ├─────► init ──────► db.ts (Schema Init)
       │
       ├─────► ingest ────► ingest.ts
       │                    │
       │                    ├─► utils.fetchMarkdown()
       │                    ├─► utils.chunkText()
       │                    ├─► utils.getEmbedding()
       │                    └─► db.query() (INSERT)
       │
       └─────► ask ────────► query.ts
                             │
                             ├─► utils.getEmbedding()
                             ├─► db.query() (VECTOR SEARCH)
                             └─► utils.generateAnswer()

┌──────────────────────────────────────────────────────┐
│              SurrealDB (Vector Storage)              │
│  ┌────────────────────────────────────────────────┐  │
│  │ doc_chunks table                               │  │
│  │ - id                                           │  │
│  │ - url: string                                  │  │
│  │ - content: string                              │  │
│  │ - embedding: array<float, 3072>                │  │
│  │                                                │  │
│  │ Index: HNSW (3072 dims, COSINE similarity)    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Project Structure

```
doc-hunter/
├── src/
│   ├── main.ts       # CLI entry point and command router
│   ├── db.ts         # Database connection and schema initialization
│   ├── ingest.ts     # Document ingestion pipeline
│   ├── query.ts      # Question answering with vector search
│   ├── utils.ts      # Core utilities (fetch, chunk, embed, generate)
│   └── types.ts      # TypeScript type definitions
├── .env              # Environment variables (GEMINI_API_KEY)
├── deno.json         # Deno configuration and dependencies
└── README.md         # This file
```

## Core Components

### 1. Database Layer (`db.ts`)

**Functions:**
- `connectDB()` - Establishes connection to SurrealDB
- `initSchema()` - Creates database schema with vector fields and index

**Schema Details:**
- **Table:** `doc_chunks` (SCHEMAFULL)
- **Fields:**
  - `url: string` - Source URL of the document
  - `content: string` - Text content of the chunk
  - `embedding: array<float, 3072>` - Vector embedding (3072 dimensions)
- **Index:** `chunk_vector` - HNSW index for cosine similarity search

**Key Code:**
```typescript
await db.connect("http://localhost:8000/rpc");
await db.signin({username: "root", password: "root"});
await db.use({ns:"test", db: "docs"});
```

### 2. Ingestion Pipeline (`ingest.ts`)

**Function:** `ingest(url: string)`

**Pipeline Steps:**

1. **Fetch Documentation**
   - Calls `fetchMarkdown(url)` to retrieve and extract text from URL
   - Strips HTML tags and cleans whitespace

2. **Chunk Text**
   - Calls `chunkText(text)` to split into ~500 word chunks
   - Prevents context overflow for embedding model

3. **Generate Embeddings**
   - Calls `getEmbedding(content)` for each chunk
   - Uses Gemini `models/gemini-embedding-001` (3072 dimensions)

4. **Store in Database**
   - Inserts each chunk with its embedding into SurrealDB
   - Uses parameterized queries to prevent injection

**Key Code:**
```typescript
await db.query(`
  INSERT INTO doc_chunks {
    url: $url,
    content: $content,
    embedding: $embedding
  }
`, { url, content, embedding });
```

### 3. Query System (`query.ts`)

**Function:** `ask(question: string)`

**Pipeline Steps:**

1. **Vectorize Question**
   - Converts user question to 3072-dimensional vector
   - Uses same embedding model as ingestion

2. **Vector Similarity Search**
   - Searches SurrealDB using cosine similarity
   - Retrieves top 3 chunks with similarity > 0.5
   - Uses HNSW index for fast search

3. **Combine Context**
   - Joins top matching chunks with separators
   - Creates comprehensive context for AI

4. **Generate Answer**
   - Calls `generateAnswer(context, question)`
   - Uses Gemini `models/gemini-2.5-flash` for response
   - Provides context-aware, accurate answers

**Key Code:**
```typescript
const results = await db.query(`
  SELECT content, vector::similarity::cosine(embedding, $vec) AS score
  FROM doc_chunks
  WHERE vector::similarity::cosine(embedding, $vec) > 0.5
  ORDER BY score DESC LIMIT 3;
`, { vec: qVector });
```

### 4. Utilities (`utils.ts`)

**Functions:**

#### `fetchMarkdown(url: string): Promise<string>`
- Fetches HTML content from URL
- Strips `<script>` and `<style>` tags
- Removes all HTML tags
- Normalizes whitespace

#### `chunkText(text: string): string[]`
- Splits text into chunks of ~500 words
- Maintains semantic coherence
- Returns array of text chunks

#### `getEmbedding(text: string): Promise<number[]>`
- Generates 3072-dimensional vector embedding
- Model: `models/gemini-embedding-001`
- Returns array of floats

#### `generateAnswer(context: string, question: string): Promise<string>`
- Uses RAG pattern: context + question → answer
- Model: `models/gemini-2.5-flash`
- Returns natural language answer

**Prompt Template:**
```
You are a helpful documentation assistant. Use the following context
from the documentation to answer the question. If the answer is not
in the context, say so.

Context: {context}
Question: {question}
Answer: {generated_response}
```

### 5. Type Definitions (`types.ts`)

```typescript
export interface DocChunk {
  url: string;
  content: string;
  embedding: number[];
}

export interface SearchResult {
  content: string;
  score: number;
}
```

## Prerequisites

1. **Deno Runtime**
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **SurrealDB**
   ```bash
   # macOS
   brew install surrealdb/tap/surreal

   # Or download from https://surrealdb.com/install
   ```

3. **Google Gemini API Key**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd doc-hunter
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Start SurrealDB
```bash
surreal start --log trace --user root --pass root memory
```

This starts SurrealDB on `http://localhost:8000` with in-memory storage.

For persistent storage:
```bash
surreal start --log trace --user root --pass root file://mydatabase.db
```

### 4. Initialize Database Schema
```bash
deno task start init
```

**Output:**
```
⚡ Initializing Schema...
🗑️  Dropping existing table...
📋 Creating table...
📝 Defining fields...
🔢 Defining embedding field (3072 dimensions)...
🔍 Creating vector index...
✅ Schema Initialized!
```

## Usage

### Command Overview

```bash
# Display help
deno task start

# Initialize database schema
deno task start init

# Ingest documentation from URL
deno task start ingest <url>

# Ask a question about ingested docs
deno task start ask "<question>"
```

### 1. Ingest Documentation

```bash
deno task start ingest https://docs.deno.com/runtime/
```

**What Happens:**
1. Fetches HTML from the URL
2. Extracts and cleans text content
3. Splits into ~500 word chunks
4. Generates 3072-dim embeddings for each chunk
5. Stores in SurrealDB with vector index

**Output:**
```
📥 Fetching https://docs.deno.com/runtime/...
✅ Fetched 3667 characters.
🔪 Split into 2 chunks.
   Saved chunk 0/2
✅ Ingestion Complete!
```

### 2. Ask Questions

```bash
deno task start ask "What is Deno?"
```

**What Happens:**
1. Converts question to 3072-dim vector
2. Searches SurrealDB for similar chunks (cosine similarity)
3. Retrieves top 3 most relevant chunks
4. Sends context + question to Gemini
5. Returns AI-generated answer

**Output:**
```
🤖 Thinking...

================ ANSWER ================

Deno is an open-source JavaScript, TypeScript, and WebAssembly
runtime with secure defaults and a great developer experience.
It is built on V8, Rust, and Tokio.
```

### Example Workflow

```bash
# 1. Initialize database
deno task start init

# 2. Ingest multiple documentation sources
deno task start ingest https://docs.deno.com/runtime/
deno task start ingest https://docs.surrealdb.com/docs/

# 3. Ask questions
deno task start ask "How do I run Deno programs?"
deno task start ask "What is vector similarity search?"
deno task start ask "How does SurrealDB handle embeddings?"
```

## Technical Details

### Vector Embeddings

- **Model:** `models/gemini-embedding-001`
- **Dimensions:** 3072
- **Type:** Dense float array
- **Similarity Metric:** Cosine similarity
- **Index Type:** HNSW (Hierarchical Navigable Small World)

### Why 3072 Dimensions?

Google's `gemini-embedding-001` model outputs 3072-dimensional vectors for rich semantic representation. The HNSW index enables fast approximate nearest neighbor search even with high dimensionality.

### Chunking Strategy

- **Chunk Size:** 500 words
- **Overlap:** None (can be added for better context)
- **Rationale:** Balances context size with embedding quality

### RAG Pipeline

**Retrieval-Augmented Generation** combines:
1. **Retrieval:** Find relevant chunks via vector search
2. **Augmentation:** Combine chunks into context
3. **Generation:** LLM generates answer from context

**Benefits:**
- Factual answers grounded in your docs
- No hallucination (answers only from provided context)
- Always up-to-date (query latest ingested docs)

## Dependencies

Configured in `deno.json`:

```json
{
  "imports": {
    "surrealdb": "npm:surrealdb@beta",
    "google-gen-ai": "npm:@google/generative-ai",
    "dotenv": "https://deno.land/std@0.224.0/dotenv/mod.ts"
  }
}
```

- **surrealdb** - SurrealDB client for Deno/Node.js
- **@google/generative-ai** - Google Gemini API client
- **dotenv** - Environment variable loader

## Permissions

The application requires these Deno permissions:
- `--allow-net` - Network access (API calls, database)
- `--allow-read` - Read .env file
- `--allow-env` - Access environment variables

## Performance Considerations

### Ingestion
- ~2-3 seconds per chunk (network + embedding generation)
- Batch processing: Sequential (can be parallelized)

### Query
- Vector search: < 100ms (HNSW index)
- Embedding generation: ~500ms
- Answer generation: 1-3 seconds
- **Total:** ~2-4 seconds per query

### Optimization Tips
1. **Batch Embeddings:** Use `asyncBatchEmbedContent` for bulk ingestion
2. **Increase Chunk Size:** For better context (at cost of precision)
3. **Adjust Similarity Threshold:** Lower for more results (0.5 → 0.3)
4. **Return More Chunks:** Change LIMIT 3 → LIMIT 5

## Troubleshooting

### SurrealDB Connection Failed
```
Error: Connection refused
```
**Solution:** Ensure SurrealDB is running:
```bash
surreal start --log trace --user root --pass root memory
```

### Invalid API Key
```
Error: [GoogleGenerativeAI Error]: Invalid API key
```
**Solution:** Check your `.env` file has correct `GEMINI_API_KEY`

### Wrong Embedding Dimensions
```
Expected array<float,3072> but found a collection of length 768
```
**Solution:** Reinitialize schema:
```bash
deno task start init
```

### No Results Found
```
❌ No relevant information found in the docs.
```
**Solution:**
1. Lower similarity threshold in `query.ts` (0.5 → 0.3)
2. Ingest more relevant documentation
3. Rephrase your question

## Future Enhancements

- [ ] Add chunk overlap for better context continuity
- [ ] Implement batch embedding for faster ingestion
- [ ] Add web UI for easier interaction
- [ ] Support multiple document formats (PDF, Markdown, etc.)
- [ ] Add conversation history for multi-turn queries
- [ ] Implement caching for faster repeated queries
- [ ] Add metadata filtering (date, source, etc.)
- [ ] Support incremental updates (avoid re-ingesting)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Built with Deno, SurrealDB, and Google Gemini**
