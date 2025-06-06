const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const Docker = require("dockerode");

const app = express();
app.use(express.json());

const CONFIG_PATH = path.join(__dirname, "editable-config.json");
let config = { tiles: [] };

// Load config at startup
async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    config = JSON.parse(raw);
  } catch (err) {
    console.error("Error loading editable-config.json:", err);
    process.exit(1);
  }
}

(async () => { await loadConfig(); })();

function findTile(id) {
  return config.tiles.find(t => t.id === id);
}

// List all tiles
app.get("/api/tiles", (req, res) => {
  res.json(config.tiles.map(({id, displayName, icon, files}) => ({
    id, displayName, icon, files
  })));
});

// Read file
app.get("/api/file", async (req, res) => {
  const { tile: tileId, file } = req.query;
  const tile = findTile(tileId);
  if (!tile || !tile.files.includes(file)) return res.status(404).json({ error: "Not found" });
  const absPath = path.join(tile.directory, file);
  try {
    const contents = await fs.readFile(absPath, "utf8");
    res.json({ contents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Write file (with backup)
app.post("/api/file", async (req, res) => {
  const { tile: tileId, file, contents } = req.body;
  const tile = findTile(tileId);
  if (!tile || !tile.files.includes(file)) return res.status(404).json({ error: "Not found" });
  const absPath = path.join(tile.directory, file);
  try {
    // Make a backup
    await fs.copyFile(absPath, absPath + ".bak." + Date.now());
    await fs.writeFile(absPath, contents, "utf8");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: restart container by name/id (uses Docker socket)
app.post("/api/restart", async (req, res) => {
  const { containerId } = req.body;
  if (!containerId) return res.status(400).json({ error: "Missing containerId" });
  try {
    const docker = new Docker({ socketPath: "/var/run/docker.sock" });
    const ctr = docker.getContainer(containerId);
    await ctr.restart();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log("Modidock backend running on " + PORT));
