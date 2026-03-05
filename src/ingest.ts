import { connectDB } from "./db.ts";
import { fetchMarkdown, chunkText, getEmbedding } from "./utils.ts";

export async function ingest(url: string) {
  const db = await connectDB();
  
  // Step 1: Get the text
  const text = await fetchMarkdown(url);
  
  // Step 2: Split it
  const chunks = chunkText(text);
  console.log(`🔪 Split into ${chunks.length} chunks.`);

  // Step 3: Loop through chunks, vectorize, and save
  for (const [i, content] of chunks.entries()) {
    const embedding = await getEmbedding(content);

    await db.query(`
      INSERT INTO doc_chunks {
        url: $url,
        content: $content,
        embedding: $embedding
      }
    `, {
      url,
      content,
      embedding
    });

    // Small log to show progress
    if (i % 5 === 0) console.log(`   Saved chunk ${i}/${chunks.length}`);
  }

  console.log("✅ Ingestion Complete!");
  await db.close();
}