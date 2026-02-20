import express from "express";
import cors from "cors";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

// Helper to get platform-specific config directory
function getConfigDir() {
  const home = os.homedir();
  switch (process.platform) {
    case "win32":
      return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "antigravity-usage");
    case "darwin":
      return path.join(home, "Library", "Application Support", "antigravity-usage");
    default: // linux and others
      return path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "antigravity-usage");
  }
}

// Automatically setup authentication from environment variables
async function initAuthentication() {
  const email = process.env.ANTIGRAVITY_EMAIL;
  const tokenJson = process.env.ANTIGRAVITY_TOKEN_JSON;

  if (!email || !tokenJson) {
    console.log("⚠️ Auth automation skipped: ANTIGRAVITY_EMAIL or ANTIGRAVITY_TOKEN_JSON not found.");
    return;
  }

  try {
    const configDir = getConfigDir();
    const tokenPath = path.join(configDir, "accounts", email, "tokens.json");

    // Ensure directory exists
    await fs.mkdir(path.dirname(tokenPath), { recursive: true });

    // Write tokens.json
    await fs.writeFile(tokenPath, tokenJson, 'utf8');

    // Also write config.json to set the default account
    const configPath = path.join(configDir, "config.json");
    await fs.writeFile(configPath, JSON.stringify({ currentAccount: email }), 'utf8');

    console.log(`✅ Authentication initialized for ${email}`);
  } catch (err) {
    console.error("❌ Failed to initialize authentication:", err.message);
  }
}

// Run init before starting server
initAuthentication();

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
    const configDir = getConfigDir();
    res.status(500).json({
      ok: false,
      error: err.message,
      debug: {
        platform: process.platform,
        home: os.homedir(),
        configDir: configDir,
        envPresent: {
          email: !!process.env.ANTIGRAVITY_EMAIL,
          token: !!process.env.ANTIGRAVITY_TOKEN_JSON
        }
      },
      fix: "Ensure ANTIGRAVITY_EMAIL and ANTIGRAVITY_TOKEN_JSON are set in dashboard."
    });
  }
});

app.listen(8787, () => {
  console.log("API running on http://localhost:8787");
}).on('error', (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
