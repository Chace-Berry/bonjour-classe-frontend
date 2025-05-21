import React, { useState, useEffect } from "react";
import useAxios from "../utils/useAxios";

const LoadingScreen = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Function to fetch appearance settings from backend
    const fetchAppearanceSettings = async () => {
      try {
        // Try getting settings from backend first
        const response = await useAxios().get('/user/appearance-settings/');
        if (response.data && response.data.dark_mode !== undefined) {
          setDarkMode(response.data.dark_mode);
          return;
        }
      } catch (error) {
     
      }
      
      // Fallback to localStorage if backend fails
      try {
        const savedSettings = localStorage.getItem('appearanceSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setDarkMode(settings.darkMode);
        }
      } catch (error) {
        console.error("Error loading appearance settings from localStorage:", error);
      }
    };

    fetchAppearanceSettings();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: darkMode ? "#121212" : "rgb(255, 255, 255)",
      }}
    >
      <svg
        className="pl"
        viewBox="0 0 200 200"
        width="200"
        height="200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pl-grad1" x1="1" y1="0.5" x2="0" y2="0.5">
            <stop offset="0%" stopColor="red" />
            <stop offset="100%" stopColor="blue" />
          </linearGradient>
          <linearGradient id="pl-grad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="red" />
            <stop offset="100%" stopColor="blue" />
          </linearGradient>
        </defs>
        <circle
          className="pl__ring"
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="url(#pl-grad1)"
          strokeWidth="36"
          strokeDasharray="0 257 1 257"
          strokeDashoffset="0.01"
          strokeLinecap="round"
          transform="rotate(-90,100,100)"
        />
        <line
          className="pl__ball"
          stroke="url(#pl-grad2)"
          x1="100"
          y1="18"
          x2="100.01"
          y2="182"
          strokeWidth="36"
          strokeDasharray="1 165"
          strokeLinecap="round"
        />
      </svg>
      <style>
        {`
          .pl__ring, .pl__ball {
            animation: ring 2s ease-out infinite;
          }
          .pl__ball {
            animation-name: ball;
          }
          @keyframes ring {
            from {
              stroke-dasharray: 0 257 0 0 1 0 0 258;
            }
            25% {
              stroke-dasharray: 0 0 0 0 257 0 258 0;
            }
            50%, to {
              stroke-dasharray: 0 0 0 0 0 515 0 0;
            }
          }
          @keyframes ball {
            from, 50% {
              animation-timing-function: ease-in;
              stroke-dashoffset: 1;
            }
            64% {
              animation-timing-function: ease-in;
              stroke-dashoffset: -109;
            }
            78% {
              animation-timing-function: ease-in;
              stroke-dashoffset: -145;
            }
            92% {
              animation-timing-function: ease-in;
              stroke-dashoffset: -157;
            }
            57%, 71%, 85%, 99%, to {
              animation-timing-function: ease-out;
              stroke-dashoffset: -163;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingScreen;