import { connectDB } from "./db.ts";
import { ingest } from "./ingest.ts";
import { askStream } from "./query.ts";

/**
 * Interactive CLI orchestrator
 * Provides a continuous session for ingesting docs and asking questions
 */
export async function startInteractive() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         🏹 Doc-Hunter Interactive Mode                ║
║   Ingest docs and ask questions in one session!      ║
╚═══════════════════════════════════════════════════════╝
`);

  // Test database connection
  console.log("🔌 Connecting to database...");
  try {
    const db = await connectDB();
    await db.close();
    console.log("✅ Database connected!\n");
  } catch (error) {
    console.error("❌ Failed to connect to database. Is SurrealDB running?");
    console.error("   Run: surreal start --user root --pass root memory\n");
    Deno.exit(1);
  }

  // Show existing documents
  await showDocumentStats();

  // Main interactive loop
  while (true) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 MENU:
  1. Ingest a new document
  2. Ask a question
  3. View ingested documents
  4. Clear all documents
  5. Exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    const choice = prompt("Choose an option (1-5):");

    if (!choice) continue;

    switch (choice.trim()) {
      case "1":
        await handleIngest();
        break;
      case "2":
        await handleAsk();
        break;
      case "3":
        await showDocumentStats();
        break;
      case "4":
        await handleClear();
        break;
      case "5":
        console.log("\n👋 Goodbye! Happy hunting!\n");
        Deno.exit(0);
      default:
        console.log("❌ Invalid option. Please choose 1-5.");
    }
  }
}

/**
 * Handle document ingestion
 */
async function handleIngest() {
  console.log("\n📥 INGEST DOCUMENT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const url = prompt("Enter the URL to ingest (or 'back' to cancel):");

  if (!url || url.toLowerCase() === "back") {
    console.log("⏭️  Cancelled.");
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    console.log("❌ Invalid URL format. Please enter a valid URL.");
    return;
  }

  console.log(`\n🚀 Starting ingestion of: ${url}\n`);

  try {
    await ingest(url);
    console.log("\n✅ Document successfully ingested!");
    console.log("💡 You can now ask questions about this document.\n");
  } catch (error) {
    console.error("\n❌ Ingestion failed:");
    console.error(`   ${error.message}\n`);
  }
}

/**
 * Handle asking questions
 */
async function handleAsk() {
  console.log("\n🤔 ASK A QUESTION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Check if there are any documents
  const db = await connectDB();
  const countResult = await db.query<number[][]>(`
    SELECT count() as total FROM doc_chunks GROUP ALL;
  `);

  const totalChunks = countResult[0]?.[0]?.total || 0;
  await db.close();

  if (totalChunks === 0) {
    console.log("⚠️  No documents ingested yet!");
    console.log("💡 Please ingest a document first (Option 1).\n");
    return;
  }

  console.log(`📚 Searching across ${totalChunks} document chunks...\n`);

  // Enter question loop
  while (true) {
    const question = prompt("Your question (or 'back' to return to menu):");

    if (!question || question.toLowerCase() === "back") {
      console.log("⏭️  Returning to menu...");
      return;
    }

    if (question.trim().length < 3) {
      console.log("❌ Question too short. Please ask a complete question.\n");
      continue;
    }

    console.log("");
    try {
      await askStream(question);
      console.log("\n");

      // Ask if they want to continue
      const continueAsking = prompt("Ask another question? (y/n):");
      if (continueAsking?.toLowerCase() !== "y") {
        console.log("⏭️  Returning to menu...");
        return;
      }
      console.log("");
    } catch (error) {
      console.error("\n❌ Failed to answer question:");
      console.error(`   ${error.message}\n`);
    }
  }
}

/**
 * Show statistics about ingested documents
 */
async function showDocumentStats() {
  console.log("\n📊 INGESTED DOCUMENTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const db = await connectDB();

    // Get document count by URL
    const results = await db.query<Array<{ url: string; count: number }>[]>(`
      SELECT url, count() as count FROM doc_chunks GROUP BY url;
    `);

    const docs = results[0] || [];

    if (docs.length === 0) {
      console.log("\n📭 No documents ingested yet.");
      console.log("💡 Use option 1 to ingest your first document!\n");
    } else {
      console.log("");
      docs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.url}`);
        console.log(`     └─ ${doc.count} chunks\n`);
      });

      const totalChunks = docs.reduce((sum, doc) => sum + doc.count, 0);
      console.log(`📈 Total: ${docs.length} document(s), ${totalChunks} chunk(s)`);
    }

    await db.close();
  } catch (error) {
    console.error("❌ Failed to retrieve document stats:");
    console.error(`   ${error.message}`);
  }

  console.log("");
}

/**
 * Clear all documents
 */
async function handleClear() {
  console.log("\n🗑️  CLEAR ALL DOCUMENTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const confirm = prompt("⚠️  This will delete ALL ingested documents. Continue? (yes/no):");

  if (confirm?.toLowerCase() !== "yes") {
    console.log("⏭️  Cancelled. No documents were deleted.\n");
    return;
  }

  try {
    const db = await connectDB();
    await db.query(`DELETE FROM doc_chunks;`);
    await db.close();

    console.log("✅ All documents cleared!\n");
  } catch (error) {
    console.error("❌ Failed to clear documents:");
    console.error(`   ${error.message}\n`);
  }
}
