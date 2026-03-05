import { Surreal } from "surrealdb"


const db = new Surreal();

export async function connectDB(){
    await db.connect("http://localhost:8000/rpc");
    await db.signin({username: "root",  password: "root" });
    await db.use({ns:"test", db: "docs"});
    return db;
}

// Runs once to set up the table structure

export async function initSchema() {

  const db = await connectDB();

  console.log("⚡ Initializing Schema...");

  // Drop existing table to ensure clean schema
  console.log("🗑️  Dropping existing table...");
  await db.query(`REMOVE TABLE IF EXISTS doc_chunks;`);

  // 1. Define the table
  console.log("📋 Creating table...");
  await db.query(`DEFINE TABLE doc_chunks SCHEMAFULL;`);

  // 2. Define fields
  console.log("📝 Defining fields...");
  await db.query(`DEFINE FIELD url ON TABLE doc_chunks TYPE string;`);
  await db.query(`DEFINE FIELD content ON TABLE doc_chunks TYPE string;`);

  // 3. THE IMPORTANT PART: Define the Vector Field
  // Gemini's 'gemini-embedding-001' model outputs 3072 dimensions.
  console.log("🔢 Defining embedding field (3072 dimensions)...");
  await db.query(`DEFINE FIELD embedding ON TABLE doc_chunks TYPE array<float, 3072>;`);

  // 4. Define the Search Index (HNSW)
  console.log("🔍 Creating vector index...");
  await db.query(`
    DEFINE INDEX chunk_vector ON TABLE doc_chunks
    FIELDS embedding HNSW DIMENSION 3072 DIST COSINE;
  `);



  console.log("✅ Schema Initialized!");

  await db.close();

}

// ... (rest of your code)

// Add this at the very end:
// @ts-ignore: Deno-specific property
if (import.meta.main) {
  await initSchema();
}