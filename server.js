import express from "express";
import cors from "cors";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

// Helper to get platform-specific config directories
function getConfigDirs() {
  const home = os.homedir();
  const dirs = [];
  switch (process.platform) {
    case "win32":
      dirs.push(path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "antigravity-usage"));
      break;
    case "darwin":
      dirs.push(path.join(home, "Library", "Application Support", "antigravity-usage"));
      break;
    default: // linux and others
      dirs.push(path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "antigravity-usage"));
      dirs.push(path.join(home, ".antigravity-usage"));
      break;
  }
  return dirs;
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
    const configDirs = getConfigDirs();
    for (const configDir of configDirs) {
      // Write directly to configDir, as the remote CLI expects it there
      const tokenPath = path.join(configDir, "tokens.json");
      const configPath = path.join(configDir, "config.json");

      // Ensure directory exists
      await fs.mkdir(configDir, { recursive: true });

      // Write tokens.json
      await fs.writeFile(tokenPath, tokenJson, 'utf8');

      // Write config.json
      await fs.writeFile(configPath, JSON.stringify({ currentAccount: email }), 'utf8');

      console.log(`✅ Authentication initialized for ${email} in ${configDir}`);
    }
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

app.get("/doctor", async (req, res) => {
  try {
    const home = os.homedir();
    const xdgConfig = path.join(home, ".config");
    const { stdout, stderr } = await execFileAsync("npx", ["antigravity-usage", "doctor"], {
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: xdgConfig }
    });
    res.json({ ok: true, stdout, stderr });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stderr: err.stderr });
  }
});

app.get("/usage", async (req, res) => {
  try {
    // Force HOME and XDG_CONFIG_HOME for the sub-process
    const home = os.homedir();
    const xdgConfig = path.join(home, ".config");

    const { stdout, stderr } = await execFileAsync("npx", ["antigravity-usage", "--json"], {
      env: {
        ...process.env,
        HOME: home,
        XDG_CONFIG_HOME: xdgConfig
      }
    });

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
    const home = os.homedir();
    res.status(500).json({
      ok: false,
      error: err.message,
      debug: {
        platform: process.platform,
        home: home,
        envEmail: !!process.env.ANTIGRAVITY_EMAIL,
        envToken: !!process.env.ANTIGRAVITY_TOKEN_JSON
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
