import React, { useEffect, useState } from "react";
import "./App.css";
import ContainerTile from "./ContainerTile";
import FileEditor from "./FileEditor";

function App() {
  const [containers, setContainers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/containers")
      .then((r) => r.json())
      .then((data) => setContainers(data))
      .catch(console.error);
  }, []);

  const handleTileClick = (ctr) => {
    setSelected({ ...ctr, currentFile: null, currentContents: "" });
  };

  const loadFile = ({ containerId, path }) => {
    fetch(`/api/file?container=${encodeURIComponent(containerId)}&file=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((data) => {
        setSelected((prev) => ({
          ...prev,
          currentFile: path,
          currentContents: data.contents,
        }));
      })
      .catch(console.error);
  };

  const saveFile = (newContents) => {
    if (!selected.currentFile) return;
    fetch("/api/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        container: selected.containerId,
        file: selected.currentFile,
        contents: newContents,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) alert("Saved!");
        else alert("Error: " + JSON.stringify(data));
      })
      .catch(console.error);
  };

  const restartContainer = () => {
    fetch("/api/restart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ container: selected.containerId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) alert("Container restarted!");
        else alert("Error restarting: " + JSON.stringify(data));
      })
      .catch(console.error);
  };

  return (
    <div className="App">
      {!selected ? (
        <div className="TileGrid">
          {containers.map((ctr) => (
            <div key={ctr.containerId} onClick={() => handleTileClick(ctr)}>
              <ContainerTile
                icon={ctr.icon}
                displayName={ctr.displayName}
                fileCount={ctr.files.length}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="DetailView">
          <button onClick={() => setSelected(null)}>← Back</button>
          <h2>
            {selected.icon} {selected.displayName}
          </h2>
          <button onClick={restartContainer}>Restart Container</button>

          <h3>Files you can edit:</h3>
          <ul>
            {selected.files.map((f) => (
              <li key={f.path}>
                <button onClick={() => loadFile({ containerId: selected.containerId, path: f.path })}>
                  {f.label}
                </button>
              </li>
            ))}
          </ul>

          {selected.currentFile && (
            <FileEditor contents={selected.currentContents} onSave={saveFile} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
