import React, { useEffect, useState } from "react";
import MonacoEditor from "react-monaco-editor";
import "./App.css";

function App() {
  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [contents, setContents] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch("/api/tiles").then(r => r.json()).then(setTiles);
  }, []);

  const loadFile = (file) => {
    fetch(`/api/file?tile=${selected.id}&file=${encodeURIComponent(file)}`)
      .then(r => r.json()).then(d => {
        setCurrentFile(file);
        setContents(d.contents || "");
        setIsEditing(true);
      });
  };

  const saveFile = () => {
    fetch("/api/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tile: selected.id, file: currentFile, contents })
    }).then(() => setIsEditing(false));
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div className="tilebar">
        {tiles.map(t => (
          <div key={t.id} className="tile" onClick={() => { setSelected(t); setIsEditing(false); }}>
            <span className="icon">{t.icon}</span>
            <div>{t.displayName}</div>
          </div>
        ))}
      </div>
      <div className="editorpane">
        {selected && (
          <>
            <h2>{selected.icon} {selected.displayName}</h2>
            {!isEditing ? (
              <ul>
                {selected.files.map(f => (
                  <li key={f}><button onClick={() => loadFile(f)}>{f}</button></li>
                ))}
              </ul>
            ) : (
              <>
                <MonacoEditor
                  height="60vh"
                  language="yaml"
                  value={contents}
                  onChange={setContents}
                />
                <button onClick={saveFile}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default App;
