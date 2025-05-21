import { useEffect } from "react";

function DisableRightClick() {
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      alert("Right-click is disabled on this page.");
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return null; // This component doesn't render anything
}

export default DisableRightClick;