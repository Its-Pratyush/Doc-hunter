import { GoogleGenerativeAI } from "google-gen-ai";
import { load } from "dotenv";

// Load environment variables
await load({ export: true });

const API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY not found in environment");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Fetch a URL and extract text content
 */
export async function fetchMarkdown(url: string): Promise<string> {
  console.log(`=� Fetching ${url}...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const html = await response.text();

  // Basic HTML to text conversion
  // Strip HTML tags and clean up whitespace
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  console.log(` Fetched ${text.length} characters.`);
  return text;
}

/**
 * Split text into chunks of approximately 500 words
 */
export function chunkText(text: string): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  const chunkSize = 500;

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Get embedding vector from Gemini
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate an answer using Gemini based on context (non-streaming)
 */
export async function generateAnswer(context: string, question: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

  const prompt = `You are a helpful documentation assistant. Use the following context from the documentation to answer the question. If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Generate an answer using Gemini with streaming (real-time response)
 */
export async function* generateAnswerStream(context: string, question: string): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

  const prompt = `You are a helpful documentation assistant. Use the following context from the documentation to answer the question. If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    yield chunkText;
  }
}
