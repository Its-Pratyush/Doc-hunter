import { initSchema } from "./db.ts";
import { ingest } from "./ingest.ts";
import { askStream } from "./query.ts";
import { startInteractive } from "./interactive.ts";

// Deno.args holds the command line arguments
// e.g. "deno task start ingest https://..." -> args[0]="ingest", args[1]="https://..."
const command = Deno.args[0];
const argument = Deno.args[1];

if (command === "init") {
  await initSchema();
}
else if (command === "ingest") {
  if (!argument) {
    console.error("❌ Please provide a URL.");
    Deno.exit(1);
  }
  await ingest(argument);
}
else if (command === "ask") {
  if (!argument) {
    console.error("❌ Please provide a question.");
    Deno.exit(1);
  }
  await askStream(argument);
}
else if (command === "interactive" || command === "i" || !command) {
  // Interactive mode is the default when no command provided
  await startInteractive();
}
else {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║              🏹 Doc-Hunter CLI                        ║
╚═══════════════════════════════════════════════════════╝

INTERACTIVE MODE (Recommended):
  deno task start                    Start interactive session
  deno task start interactive        Start interactive session
  deno task start i                  Start interactive session (short)

DIRECT COMMANDS (For scripting/automation):
  deno task start init               Initialize database schema
  deno task start ingest <url>       Ingest a document from URL
  deno task start ask "<question>"   Ask a question about ingested docs

💡 Tip: Run 'deno task start' to enter interactive mode!
  `);
}