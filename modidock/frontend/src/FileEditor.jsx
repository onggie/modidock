import React, { useState, useEffect } from "react";

function FileEditor({ contents, onSave }) {
  const [text, setText] = useState(contents);

  useEffect(() => {
    setText(contents);
  }, [contents]);

  return (
    <div className="EditorPane">
      <textarea
        style={{ width: "100%", height: "60vh", fontFamily: "monospace" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => onSave(text)}>Save</button>
    </div>
  );
}

export default FileEditor;
