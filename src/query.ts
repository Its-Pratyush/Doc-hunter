import { connectDB } from "./db.ts";
import { getEmbedding, generateAnswer, generateAnswerStream } from "./utils.ts";
import { SearchResult } from "./types.ts";

export async function ask(question: string) {
  const db = await connectDB();

  // Step 1: Turn the user's question into a vector
  const qVector = await getEmbedding(question);

  // Step 2: Search SurrealDB for similar vectors
  // We use cosine similarity > 0.5 to ensure relevance
  const results = await db.query<SearchResult[][]>(`
    SELECT content, vector::similarity::cosine(embedding, $vec) AS score
    FROM doc_chunks
    WHERE vector::similarity::cosine(embedding, $vec) > 0.5
    ORDER BY score DESC LIMIT 3;
  `, { vec: qVector });

  const topChunks = results[0];

  if (topChunks.length === 0) {
    console.log("❌ No relevant information found in the docs.");
    await db.close();
    return;
  }

  // Step 3: Combine the top 3 chunks into one big string
  const context = topChunks.map(c => c.content).join("\n---\n");

  // Step 4: Ask Gemini
  console.log("🤖 Thinking...");
  const answer = await generateAnswer(context, question);

  console.log("\n================ ANSWER ================\n");
  console.log(answer);

  await db.close();
}

/**
 * Ask a question with streaming response (real-time)
 */
export async function askStream(question: string) {
  const db = await connectDB();

  // Step 1: Turn the user's question into a vector
  const qVector = await getEmbedding(question);

  // Step 2: Search SurrealDB for similar vectors
  const results = await db.query<SearchResult[][]>(`
    SELECT content, vector::similarity::cosine(embedding, $vec) AS score
    FROM doc_chunks
    WHERE vector::similarity::cosine(embedding, $vec) > 0.5
    ORDER BY score DESC LIMIT 3;
  `, { vec: qVector });

  const topChunks = results[0];

  if (topChunks.length === 0) {
    console.log("❌ No relevant information found in the docs.");
    await db.close();
    return;
  }

  // Step 3: Combine the top 3 chunks into one big string
  const context = topChunks.map(c => c.content).join("\n---\n");

  // Step 4: Ask Gemini with streaming
  console.log("🤖 Thinking...\n");
  console.log("================ ANSWER ================\n");

  // Stream the response character by character
  for await (const chunk of generateAnswerStream(context, question)) {
    // Write without newline to get streaming effect
    await Deno.stdout.write(new TextEncoder().encode(chunk));
  }

  console.log("\n");

  await db.close();
}