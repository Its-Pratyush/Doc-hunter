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

## Quick Start

Get Doc-Hunter running in 5 minutes! Choose between Docker (recommended) or manual setup.

### Prerequisites

#### 1. Install Deno

**macOS/Linux:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**Verify installation:**
```bash
deno --version
```

#### 2. Install Docker (Recommended) OR SurrealDB

**Option A: Docker (Recommended)**

- **macOS:** [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:**
  ```bash
  # Ubuntu/Debian
  sudo apt-get update
  sudo apt-get install docker.io docker-compose

  # Start Docker
  sudo systemctl start docker
  ```
- **Windows:** [Download Docker Desktop](https://www.docker.com/products/docker-desktop)

**Verify Docker:**
```bash
docker --version
docker-compose --version
```

**Option B: SurrealDB (Manual)**

```bash
# macOS
brew install surrealdb/tap/surreal

# Linux
curl -sSf https://install.surrealdb.com | sh

# Windows
iwr https://install.surrealdb.com -useb | iex
```

#### 3. Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (starts with `AIza...`)

---

### Setup Instructions

#### Step 1: Clone the Repository

```bash
git clone https://github.com/Its-Pratyush/Doc-hunter.git
cd doc-hunter
```

#### Step 2: Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API key
# Replace 'your_api_key_here' with your actual Gemini API key
```

**Example `.env` file:**
```env
GEMINI_API_KEY=AIzaSyABC123...your_actual_key_here
```

#### Step 3: Start SurrealDB

Choose **ONE** of the following methods:

**🐳 Method A: Docker (Recommended)**

```bash
# Start SurrealDB in background
docker-compose up -d

# Verify it's running
docker-compose ps
```

**Output:**
```
NAME                IMAGE                         STATUS
doc-hunter-surrealdb-1   surrealdb/surrealdb:latest   Up 5 seconds
```

**Stop SurrealDB when done:**
```bash
docker-compose down
```

**📦 Method B: Manual (No Docker)**

```bash
# Start SurrealDB (in-memory, for testing)
surreal start --log trace --user root --pass root memory

# OR for persistent storage
surreal start --log trace --user root --pass root file://mydatabase.db
```

Keep this terminal running. Open a new terminal for the next steps.

#### Step 4: Initialize Database Schema

```bash
deno task start init
```

**Expected Output:**
```
⚡ Initializing Schema...
🗑️  Dropping existing table...
📋 Creating table...
📝 Defining fields...
🔢 Defining embedding field (3072 dimensions)...
🔍 Creating vector index...
✅ Schema Initialized!
```

#### Step 5: Start Using Doc-Hunter!

**Interactive Mode (Recommended for Beginners):**

```bash
deno task start
```

**You'll see:**
```
╔═══════════════════════════════════════════════════════╗
║         🏹 Doc-Hunter Interactive Mode                ║
║   Ingest docs and ask questions in one session!      ║
╚═══════════════════════════════════════════════════════╝

🔌 Connecting to database...
✅ Database connected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 MENU:
  1. Ingest a new document
  2. Ask a question
  3. View ingested documents
  4. Clear all documents
  5. Exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Choose an option (1-5):
```

---

### Your First Query - Complete Example

Let's ingest Deno documentation and ask questions:

#### 1. Start Interactive Mode

```bash
deno task start
```

#### 2. Ingest a Document

- Choose option `1` (Ingest a new document)
- Enter URL: `https://docs.deno.com/runtime/`
- Wait for ingestion to complete (~10-30 seconds)

**You'll see:**
```
📥 Fetching https://docs.deno.com/runtime/...
✅ Fetched 3667 characters.
🔪 Split into 2 chunks.
   Saved chunk 0/2
✅ Ingestion Complete!
```

#### 3. Ask Questions

- Choose option `2` (Ask a question)
- Enter question: `What is Deno?`
- Watch the answer stream in real-time!

**You'll see:**
```
🤖 Thinking...

================ ANSWER ================

Deno is an open-source JavaScript, TypeScript, and WebAssembly
runtime with secure defaults and a great developer experience.
It is built on V8, Rust, and Tokio.
```

#### 4. Ask More Questions

- Type `y` to ask another question
- Try: `How do I run TypeScript files in Deno?`
- Try: `What are Deno's security features?`

#### 5. Exit

- Type `n` when done asking questions
- Choose option `5` to exit

---

### Command Line Mode (For Automation)

If you prefer direct commands instead of interactive mode:

```bash
# Initialize database
deno task start init

# Ingest a document
deno task start ingest https://docs.deno.com/runtime/

# Ask a question
deno task start ask "What is Deno?"

# View help
deno task start help
```

---

### Multiple Documentation Sources

You can ingest multiple sources and query across all of them:

```bash
# Start interactive mode
deno task start

# Choose option 1, ingest first doc
# Enter: https://docs.deno.com/runtime/

# Choose option 1 again, ingest second doc
# Enter: https://docs.surrealdb.com/

# Choose option 2, ask questions
# Your question: "Compare Deno and SurrealDB"
# The system searches across BOTH documentation sources!
```

---

### Troubleshooting

#### Issue: "Failed to connect to database"

**Solution:**
```bash
# Check if SurrealDB is running

# For Docker:
docker-compose ps

# If not running:
docker-compose up -d

# For manual installation:
# Make sure surreal start command is running in another terminal
```

#### Issue: "GEMINI_API_KEY not found"

**Solution:**
```bash
# Check if .env file exists
ls -la .env

# If not, create it:
cp .env.example .env

# Edit .env and add your key:
# GEMINI_API_KEY=your_actual_key_here
```

#### Issue: "Invalid API key"

**Solution:**
- Verify your Gemini API key at https://aistudio.google.com/apikey
- Make sure there are no spaces or quotes around the key in `.env`
- Format: `GEMINI_API_KEY=AIzaSyABC123...` (no spaces, no quotes)

#### Issue: Deno command not found

**Solution:**
```bash
# Add Deno to PATH (macOS/Linux)
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Or for zsh:
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify:
deno --version
```

---

### Next Steps

- 📚 **Ingest More Docs:** Add your favorite documentation sites
- 🔍 **Explore Features:** Try viewing stats (option 3) or clearing docs (option 4)
- ⚙️ **Customize:** Adjust chunk size, similarity threshold (see Advanced Configuration below)
- 🚀 **Automate:** Use command line mode in scripts

---

## Project Structure

```
doc-hunter/
├── src/
│   ├── main.ts          # CLI entry point and command router
│   ├── db.ts            # Database connection and schema initialization
│   ├── ingest.ts        # Document ingestion pipeline
│   ├── query.ts         # Question answering with vector search
│   ├── interactive.ts   # Interactive mode orchestrator
│   ├── utils.ts         # Core utilities (fetch, chunk, embed, generate)
│   └── types.ts         # TypeScript type definitions
├── .env                 # Environment variables (GEMINI_API_KEY)
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── docker-compose.yml   # Docker configuration for SurrealDB
├── deno.json            # Deno configuration and dependencies
└── README.md            # This file
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

## Advanced Usage

### Command Reference

```bash
# Interactive mode (default)
deno task start
deno task start interactive
deno task start i

# Direct commands
deno task start init                    # Initialize database schema
deno task start ingest <url>            # Ingest documentation from URL
deno task start ask "<question>"        # Ask a question (with streaming)
```

### Interactive Mode Features

1. **Ingest Documents** - Add documentation from any URL
2. **Ask Questions** - Query with real-time streaming answers
3. **View Statistics** - See all ingested documents and chunk counts
4. **Clear Database** - Remove all documents (with confirmation)
5. **Continuous Session** - Ask multiple questions without restarting

### How Ingestion Works

**Pipeline:**
1. **Fetch** - Downloads HTML from URL
2. **Extract** - Removes HTML tags and cleans text
3. **Chunk** - Splits into ~500 word chunks
4. **Embed** - Generates 3072-dimensional vectors using Gemini
5. **Store** - Saves chunks with embeddings in SurrealDB

**Example:**
```bash
deno task start ingest https://docs.deno.com/runtime/
```

**Output:**
```
📥 Fetching https://docs.deno.com/runtime/...
✅ Fetched 3667 characters.
🔪 Split into 2 chunks.
   Saved chunk 0/2
✅ Ingestion Complete!
```

### How Question Answering Works

**Pipeline:**
1. **Vectorize** - Converts your question to a 3072-dim vector
2. **Search** - Finds top 3 similar chunks using cosine similarity
3. **Context** - Combines relevant chunks
4. **Generate** - Gemini AI generates answer from context
5. **Stream** - Answer appears in real-time

**Example:**
```bash
deno task start ask "What is Deno?"
```

**Output:**
```
🤖 Thinking...

================ ANSWER ================

Deno is an open-source JavaScript, TypeScript, and WebAssembly
runtime with secure defaults and a great developer experience.
It is built on V8, Rust, and Tokio.
```

### Database Persistence

**With Docker (Recommended):**
- Data persists in Docker volume `surreal_data`
- Survives container restarts
- View data: Access Surrealist UI or query directly

**View Stored Data:**
```bash
# Connect to SurrealDB
surreal sql --conn http://localhost:8000 --user root --pass root --ns test --db docs

# Query documents
SELECT url, count() FROM doc_chunks GROUP BY url;

# View specific chunks
SELECT * FROM doc_chunks LIMIT 5;
```

**Clear All Data:**
```bash
# Option 1: Use interactive mode (option 4)
deno task start

# Option 2: Direct SQL
surreal sql --conn http://localhost:8000 --user root --pass root --ns test --db docs
DELETE FROM doc_chunks;

# Option 3: Reinitialize (drops and recreates table)
deno task start init
```

### Working with Multiple Documents

Doc-Hunter stores **all documents globally** - there's no session isolation:

```bash
# Day 1: Ingest Deno docs
deno task start ingest https://docs.deno.com/runtime/

# Day 2: Ingest SurrealDB docs
deno task start ingest https://docs.surrealdb.com/

# Ask questions - searches BOTH sources automatically
deno task start ask "What is vector search?"
# Returns results from SurrealDB docs (higher similarity)

deno task start ask "How do I run TypeScript?"
# Returns results from Deno docs (higher similarity)
```

**Benefits:**
- Build a comprehensive knowledge base
- Cross-reference multiple sources
- Automatic relevance ranking

**Limitations:**
- No per-session isolation
- Can't filter by specific source (yet)
- Old docs persist unless manually deleted
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
