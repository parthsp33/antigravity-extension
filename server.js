import express from "express";
import cors from "cors";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const app = express();
app.use(cors());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/usage", async (req, res) => {
  try {
    const { stdout, stderr } = await execFileAsync("npx", ["antigravity-usage", "--json"]);

    const output = stdout.trim();

    let parsed = null;
    if (output.startsWith("{") || output.startsWith("[")) {
      try {
        parsed = JSON.parse(output);
      } catch { }
    }

    res.json({
      ok: true,
      parsedJson: parsed,
      rawText: parsed ? null : output,
      stderr: stderr || null,
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      fix: "Run antigravity-usage in terminal first. If it works there, Node will work too."
    });
  }
});

app.listen(8787, () => {
  console.log("API running on http://localhost:8787");
}).on('error', (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
