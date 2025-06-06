const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const Docker = require("dockerode");

const app = express();
app.use(express.json());

const CONFIG_PATH = "/app/config/editable-config.json";
let editableConfig = { containers: [] };

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    editableConfig = JSON.parse(raw);
  } catch (err) {
    console.error("Error loading editable-config.json:", err);
    process.exit(1);
  }
}

let containerMap = {};
async function updateContainerMap() {
  containerMap = {};
  for (const ctr of editableConfig.containers) {
    containerMap[ctr.containerId] = {
      displayName: ctr.displayName,
      icon: ctr.icon,
      volumeRoot: ctr.volumeRoot,
      files: ctr.files,
    };
  }
}

(async () => {
  await loadConfig();
  await updateContainerMap();
})();

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

function ensureUnderVolumeRoot(volumeRoot, requestedRelPath) {
  const abs = path.resolve(volumeRoot, requestedRelPath);
  return abs.startsWith(path.resolve(volumeRoot));
}

app.get("/api/containers", (req, res) => {
  const resp = Object.entries(containerMap).map(([containerId, info]) => ({
    containerId,
    displayName: info.displayName,
    icon: info.icon,
    files: info.files,
  }));
  res.json(resp);
});

app.get("/api/file", async (req, res) => {
  try {
    const { container: ctrId, file } = req.query;
    if (!ctrId || !file) {
      return res.status(400).json({ error: "Missing container or file param" });
    }
    const info = containerMap[ctrId];
    if (!info) {
      return res.status(404).json({ error: "Container not allowed" });
    }
    const allowed = info.files.map((f) => f.path);
    if (!allowed.includes(file)) {
      return res.status(403).json({ error: "File not permitted" });
    }
    const absPath = path.resolve(info.volumeRoot, file);
    if (!ensureUnderVolumeRoot(info.volumeRoot, file)) {
      return res.status(403).json({ error: "Invalid path" });
    }
    const contents = await fs.readFile(absPath, "utf8");
    res.json({ contents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read file", details: err.message });
  }
});

app.post("/api/file", async (req, res) => {
  try {
    const { container: ctrId, file, contents } = req.body;
    if (!ctrId || !file || typeof contents !== "string") {
      return res.status(400).json({ error: "Missing container, file, or contents" });
    }
    const info = containerMap[ctrId];
    if (!info) {
      return res.status(404).json({ error: "Container not allowed" });
    }
    const allowed = info.files.map((f) => f.path);
    if (!allowed.includes(file)) {
      return res.status(403).json({ error: "File not permitted" });
    }
    const absPath = path.resolve(info.volumeRoot, file);
    if (!ensureUnderVolumeRoot(info.volumeRoot, file)) {
      return res.status(403).json({ error: "Invalid path" });
    }
    const backupPath = `${absPath}.bak.${Date.now()}`;
    await fs.copyFile(absPath, backupPath);
    await fs.writeFile(absPath, contents, "utf8");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to write file", details: err.message });
  }
});

app.post("/api/restart", async (req, res) => {
  try {
    const { container: ctrId } = req.body;
    if (!ctrId) {
      return res.status(400).json({ error: "Missing container param" });
    }
    const info = containerMap[ctrId];
    if (!info) {
      return res.status(404).json({ error: "Container not allowed" });
    }
    const ctr = docker.getContainer(ctrId);
    await ctr.restart();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to restart container", details: err.message });
  }
});

const frontendPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendPath));
app.get("/*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Server error", details: err.message });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Modidock backend running on port ${PORT}`);
});

