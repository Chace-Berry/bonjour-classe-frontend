import React from "react";

const CustomToolbar = ({ label, onNavigate }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
      <button
        onClick={() => onNavigate("PREV")}
        style={{
          cursor: "pointer",
          background: "none",
          border: "none", // Removed the border
          fontSize: "16px",
          color: "#6a5acd",
        }}
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <span style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>{label}</span>
      <button
        onClick={() => onNavigate("NEXT")}
        style={{
          cursor: "pointer",
          background: "none",
          border: "none", // Removed the border
          fontSize: "16px",
          color: "#6a5acd",
        }}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

export default CustomToolbar;