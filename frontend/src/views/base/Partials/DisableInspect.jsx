import { useEffect } from "react";

function DisableInspect() {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      alert("Right-click is disabled on this page.");
    };

    // Disable specific key combinations
    const handleKeyDown = (e) => {
      // Disable F12
      if (e.key === "F12") {
        e.preventDefault();
        alert("F12 is disabled on this page.");
      }

      // Disable Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        alert("Ctrl+Shift+I is disabled on this page.");
      }
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9999,
        pointerEvents: "none", // Prevent interaction with the overlay
        backgroundColor: "rgba(0, 0, 0, 0)", // Transparent overlay
      }}
    ></div>
  );
}

export default DisableInspect;