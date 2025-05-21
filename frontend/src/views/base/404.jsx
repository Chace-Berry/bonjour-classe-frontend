import { Croissant, Wine, Cake } from "lucide-react";
import EiffelTower from "../../components/EiffelTower"; // Adjust the import path as necessary
import React, { useState } from "react";

const NotFound = () => {
  const [hoverHome, setHoverHome] = useState(false);
  const [hoverParis, setHoverParis] = useState(false);
  const pageStyle = {
    position: "relative",
    width: "100%",
    height: "100vh",
    backgroundColor: "#ffffff", // White background
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column", // Stack elements vertically
    fontFamily: "Arial, sans-serif",
  };

  const barContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "20px", // Space between bars and "404"
  };

  const barStyle = {
    width: "50px",
    height: "5px",
    margin: "0 5px", // Space between bars
  };

  const blueBarStyle = {
    ...barStyle,
    backgroundColor: "blue",
  };

  const whiteBarStyle = {
    ...barStyle,
    backgroundColor: "white",
    border: "1px solid #ccc", // Optional border for visibility
  };

  const redBarStyle = {
    ...barStyle,
    backgroundColor: "red",
  };

  const headingStyle = {
    fontSize: "8rem", // Massive size
    fontWeight: "bold", // Really thick
    background: "linear-gradient(to right, #4a90e2, #8e44ad,rgb(146, 0, 0))", // Gradient for text
    WebkitBackgroundClip: "text", // Clip background to text
    WebkitTextFillColor: "transparent", // Make text transparent to show gradient
    textAlign: "center", // Center the text
    margin: "0", // Remove default margin
  };

  const paragraphStyle = {
    fontSize: "1.2rem",
    color: "#6b4226",
    textAlign: "center", // Center the paragraph
  };

  const iconStyle = {
    position: "absolute",
    opacity: 0.5,
    animation: "tilt 3s infinite ease-in-out", // Add tilt animation
  };

  const topLeftStyle = {
    ...iconStyle,
    top: "20px",
    left: "20px",
    color: "#d4a373", // Peach-beige color
  };

  const topRightStyle = {
    ...iconStyle,
    top: "20px",
    right: "20px",
    color: "#d4a373",
  };

  const bottomLeftStyle = {
    ...iconStyle,
    bottom: "20px",
    left: "20px",
    color: "#d4a373",
  };

  const bottomRightStyle = {
    ...iconStyle,
    bottom: "20px",
    right: "20px",
    color: "#d4a373",
  };

  return (
    <div style={pageStyle}>
      {/* Top-left croissant */}
      <div style={topLeftStyle}>
        <Croissant size={32} />
      </div>

      {/* Top-right wine */}
      <div style={topRightStyle}>
        <Wine size={32} />
      </div>

      {/* Bottom-left cake */}
      <div style={bottomLeftStyle}>
        <Cake size={32} />
      </div>

      {/* Bottom-right croissant */}
      <div style={bottomRightStyle}>
        <Croissant size={32} />
      </div>

      {/* Three separate bars */}
      <div style={barContainerStyle}>
        <div style={blueBarStyle}></div>
        <div style={whiteBarStyle}></div>
        <div style={redBarStyle}></div>
      </div>

      {/* Main content */}
      <div>
        <h1 style={headingStyle}>404</h1>
      </div>
      <div className="flex justify-center items-center -mt-6 mb-6" style={{ flexDirection: "column",width: "20%"}}>
        <EiffelTower />
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", marginTop: "10px" }}>
        Oops! Page Not Found
        </h2>
        <p style={paragraphStyle}>Looks like you've wandered into a Parisian side street that doesn't exist. Shall we help you find your way back?</p>
      </div>
      <div>
      {/* Buttons */}
      <div className="flex justify-center items-center" style={{ marginTop: "20px" }}>
        <button
          style={{
            backgroundColor: hoverHome ? "#003d99" : "blue", // Darker blue on hover
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            fontSize: "1rem",
            marginRight: "10px",
            cursor: "pointer",
            transition: "background-color 0.3s ease", // Smooth transition
          }}
          onMouseEnter={() => setHoverHome(true)}
          onMouseLeave={() => setHoverHome(false)}
          onClick={() => window.location.href = "/"} // Redirect to home
        >
          Back to Home
        </button>
        <button
          style={{
            backgroundColor: hoverParis ? "rgba(0, 0, 255, 0.1)" : "transparent", // Light blue on hover
            color: hoverParis ? "#003d99" : "blue", // Darker blue text on hover
            border: "2px solid blue",
            padding: "10px 20px",
            borderRadius: "5px",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "background-color 0.3s ease, color 0.3s ease", // Smooth transition
          }}
          onMouseEnter={() => setHoverParis(true)}
          onMouseLeave={() => setHoverParis(false)}
          onClick={() => window.location.href = "https://www.google.com/maps/place/Paris,+France"} // Redirect to Paris page
        >
          Find your way in Paris
        </button>
      </div>
    </div>
    {/* Footer bars */}
    <div style={{ display: "flex", position: "absolute", bottom: "0", width: "100%" }}>
    <div style={{ height: "5px", backgroundColor: "blue", flexGrow: 1 }}></div>
    <div style={{ height: "5px", backgroundColor: "white", flexGrow: 1 }}></div>
    <div style={{ height: "5px", backgroundColor: "red", flexGrow: 1 }}></div>
    </div>
      {/* Add keyframes for tilt animation */}
      <style>
        {`
          @keyframes tilt {
            0%, 100% {
              transform: rotate(0deg);
            }
            25% {
              transform: rotate(-5deg);
            }
            50% {
              transform: rotate(5deg);
            }
            75% {
              transform: rotate(-3deg);
            }
          }
        `}
      </style>

      {/* Add hover effects */}
<style>
  {`
    .hover-darken-blue:hover {
      background-color: #003d99; /* Darker blue */
    }
    .hover-darken-outline:hover {
      background-color: rgba(0, 0, 255, 0.1); /* Light blue background */
      color: #003d99; /* Darker blue text */
    }
  `}
</style>
    </div>
  );
};

export default NotFound;