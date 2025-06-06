import React from "react";
import PropTypes from "prop-types";

function ContainerTile({ icon, displayName, fileCount }) {
  return (
    <div className="ContainerTile">
      <div className="Icon">{icon}</div>
      <div className="Name">{displayName}</div>
      <div className="FileCount">{fileCount} file{fileCount !== 1 ? "s" : ""}</div>
    </div>
  );
}

ContainerTile.propTypes = {
  icon: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  fileCount: PropTypes.number.isRequired,
};

export default ContainerTile;
