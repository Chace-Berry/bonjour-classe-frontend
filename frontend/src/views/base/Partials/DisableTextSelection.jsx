import { useEffect } from "react";

function DisableTextSelection() {
  useEffect(() => {
    const handleSelectStart = (e) => {
      e.preventDefault();
    };

    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  return null; // This component doesn't render anything
}

export default DisableTextSelection;