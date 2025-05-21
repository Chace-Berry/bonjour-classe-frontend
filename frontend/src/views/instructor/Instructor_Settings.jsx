import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import InstructorSidebar from "./Partials/InstructorSidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import { ProfileContext } from "../plugin/Context";
import { FaMoon, FaSun, FaFont, FaEye, FaPalette } from 'react-icons/fa';
import { Form } from 'react-bootstrap';

function Instructor_Settings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useContext(ProfileContext);
  const [profileData, setProfileData] = useState({
    image: "",
    full_name: "",
    about: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Add appearance settings state variables
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16); // default font size
  const [highContrast, setHighContrast] = useState(false);
  const [colorTheme, setColorTheme] = useState("default");
  const [density, setDensity] = useState("comfortable");

  // 1. Add a state variable to track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const fetchProfile = () => {
    useAxios()
      .get(`user/profile/${UserData()?.user_id}/`)
      .then((res) => {
        setProfile(res.data);
        setProfileData(res.data);
        setImagePreview(res.data.image);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          navigate("/");
        }
      });
  };

  useEffect(() => {
    const userId = UserData()?.user_id;
    if (!userId) {
      navigate("/");
      return;
    }

    fetchProfile();
  }, []);

  // In your useEffect, check if the page already has dark styling
  useEffect(() => {
    // Check if body already has dark-mode class
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('appearanceSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      // Use the current body class as the source of truth if it exists
      setDarkMode(isDarkMode || settings.darkMode || false);
      setFontSize(settings.fontSize || 16);
      setHighContrast(settings.highContrast || false);
      setColorTheme(settings.colorTheme || "default");
      setDensity(settings.density || "comfortable");
    } else {
      // If no saved settings, use the current body class
      setDarkMode(isDarkMode);
    }
    
    // Apply settings to document after state is set
    setTimeout(() => applyAppearanceSettings(), 100);
  }, []);

  // 4. Update useEffect to properly load and apply settings on mount
  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('appearanceSettings');
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        // Set state with saved settings
        setDarkMode(settings.darkMode || false);
        setFontSize(settings.fontSize || 16);
        setHighContrast(settings.highContrast || false);
        setColorTheme(settings.colorTheme || "default");
        setDensity(settings.density || "comfortable");
        
        // Apply saved settings immediately on page load
        setTimeout(() => {
          if (settings.darkMode) document.body.classList.add('dark-mode');
          if (settings.highContrast) document.body.classList.add('high-contrast');
          document.documentElement.style.fontSize = `${settings.fontSize}px`;
          document.body.setAttribute('data-theme', settings.colorTheme || 'default');
          document.body.setAttribute('data-density', settings.density || 'comfortable');
        }, 100);
      } catch (error) {
        // console.error("Error loading appearance settings:", error);
      }
    }
  }, []);

  // Function to apply settings
  const applyAppearanceSettings = () => {
    // console.log("Applying settings with darkMode =", darkMode);
    
    // Remove all theme classes first
    document.body.classList.remove('dark-mode', 'high-contrast');
    
    // Apply dark mode class only if true
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }
    
    // Apply high contrast only if true
    if (highContrast) {
      document.body.classList.add('high-contrast');
    }
    
    // Apply font size to the document root
    document.documentElement.style.fontSize = `${fontSize}px`;
    
    // Apply color theme and density as data attributes
    document.body.setAttribute('data-theme', colorTheme);
    document.body.setAttribute('data-density', density);
    
    // Save to localStorage
    localStorage.setItem('appearanceSettings', JSON.stringify({
      darkMode,
      fontSize,
      highContrast,
      colorTheme,
      density
    }));
    
    // console.log("Settings applied", { darkMode, fontSize, highContrast, colorTheme, density });
  };

  // Handler functions for appearance settings
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    setHasUnsavedChanges(true);
  };
  
  const handleFontSizeChange = (e) => {
    setFontSize(parseInt(e.target.value));
    setHasUnsavedChanges(true);
  };
  
  const handleHighContrastToggle = () => {
    setHighContrast(!highContrast);
    setHasUnsavedChanges(true);
  };
  
  
  const handleDensityChange = (e) => {
    setDensity(e.target.value);
    setHasUnsavedChanges(true);
  };

  // 3. Add new handler for Apply button
  const handleApplySettings = async () => {
    try {
      // Apply settings locally
      applyAppearanceSettings();
      
      // Save to backend if user is authenticated
      const api = useAxios();
      const response = await api.post('user/appearance-settings/', {
        dark_mode: darkMode,
        font_size: fontSize,
        high_contrast: highContrast,
        color_theme: colorTheme,
        density: density
      });
      
      // console.log("Settings saved to server:", response.data);
      setHasUnsavedChanges(false);
      setSuccessMessage("Settings applied and saved to your account!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      // console.error("Error saving settings to server:", error);
      // Settings still applied locally
      setSuccessMessage("Settings applied locally");
    }
  };

  const handleProfileChange = (event) => {
    setProfileData({
      ...profileData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setProfileData({
      ...profileData,
      [event.target.name]: selectedFile,
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    if (selectedFile) {
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formdata = new FormData();

    if (profileData.image && typeof profileData.image !== "string") {
      formdata.append("image", profileData.image);
    }
    formdata.append("id", profileData.id || "");
    formdata.append("full_name", profileData.full_name || "");
    formdata.append("country", profileData.country || "");
    formdata.append("about", profileData.about || "");
    formdata.append("date", profileData.date || "");
    formdata.append("otp", profileData.otp || null);
    formdata.append("user", profileData.user || "");

    try {
      const response = await useAxios().patch(
        `user/profile/${UserData()?.user_id}/`,
        formdata,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setProfile(response.data);
      setSuccessMessage("Profile was successfully updated!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      // console.error("Error updating profile:", error.response?.data || error);
      setSuccessMessage("Failed to update profile. Please try again.");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };


  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
    },
    mainContent: {
      flex: 1,
      marginLeft: sidebarCollapsed ? "80px" : "270px",
      transition: "margin-left 0.3s ease",
    },
    profileContainer: {
      display: "flex",
      marginTop: "20px",
      height: "calc(100vh - 80px)",
    },
    navBar: {
      width: "250px",
      backgroundColor: "#f8f9fa",
      borderRight: "1px solid #ddd",
      padding: "20px",
    },
    navButton: {
      display: "block",
      width: "100%",
      padding: "10px 15px",
      fontSize: "14px",
      textAlign: "left",
      marginBottom: "10px",
      border: "none",
      borderRadius: "4px",
      backgroundColor: "#e9ecef",
      color: "#000",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    navButtonActive: {
      backgroundColor: "#007bff",
      color: "#fff",
    },
    content: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
    },
    avatar: {
      width: "100px",
      height: "100px",
      borderRadius: "50%",
      objectFit: "cover",
    },
    successMessage: {
      color: "green",
      marginLeft: "10px",
      fontSize: "14px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <InstructorSidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Profile Navigation and Content */}
        <div style={styles.profileContainer}>
          {/* Profile Navigation Bar */}
          <div className="settings-nav">
            <button
              className={`settings-nav-btn${activeTab === "profile" ? " active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`settings-nav-btn${activeTab === "Appearance" ? " active" : ""}`}
              onClick={() => setActiveTab("Appearance")}
            >
              Appearance
            </button>
          </div>

          {/* Content Area */}
          <div style={styles.content}>
            {activeTab === "profile" && (
              <div>
                <h4 className="mb-4">Profile Details</h4>
                <form onSubmit={handleFormSubmit}>
                  <div className="d-flex align-items-center mb-4">
                    <img
                      src={imagePreview}
                      alt="avatar"
                      style={styles.avatar}
                    />
                    <div className="ms-3">
                      <h5>Change Profile Image</h5>
                      <label
                        htmlFor="upload-avatar"
                        style={{
                          display: "inline-block",
                          padding: "10px 20px",
                          fontSize: "14px",
                          color: "red",
                          border: "2px solid red",
                          borderRadius: "4px",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                          transition: "background-color 0.3s ease, color 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "red";
                          e.target.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "red";
                        }}
                      >
                        Upload Profile Picture
                      </label>
                      <input
                        type="file"
                        id="upload-avatar"
                        className="form-control mt-2"
                        name="image"
                        onChange={handleFileChange}
                        style={{
                          display: "none",
                        }}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">UserName</label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">About Me</label>
                    <textarea
                      className="form-control"
                      name="about"
                      rows="4"
                      value={profileData.about}
                      onChange={handleProfileChange}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Update Profile
                  </button>
                  {successMessage && (
                    <span style={styles.successMessage}>{successMessage}</span>
                  )}
                </form>
              </div>
            )}

            {activeTab === "Appearance" && (
              <div>
                <h4 className="mb-4">Appearance Settings</h4>
                
                <div className="appearance-setting-container p-4 mb-4 bg-light rounded">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        {darkMode ? <FaMoon size={24} /> : <FaSun size={24} />}
                      </div>
                      <span className="fw-medium">Dark Mode</span>
                    </div>
                    <Form.Check 
                      type="switch"
                      id="dark-mode-switch"
                      checked={darkMode}
                      onChange={handleDarkModeToggle}
                    />
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <FaFont size={24} />
                      </div>
                      <span className="fw-medium">Font Size</span>
                    </div>
                    <Form.Range 
                      min={12}
                      max={24}
                      step={1}
                      value={fontSize}
                      onChange={handleFontSizeChange}
                      style={{ width: '50%' }}
                    />
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <FaEye size={24} />
                      </div>
                      <span className="fw-medium">High Contrast</span>
                    </div>
                    <Form.Check 
                      type="switch"
                      id="high-contrast-switch"
                      checked={highContrast}
                      onChange={handleHighContrastToggle}
                    />
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <FaPalette size={24} />
                      </div>
                      <span className="fw-medium">Density</span>
                    </div>
                    <Form.Select 
                      value={density}
                      onChange={handleDensityChange}
                      style={{ width: '50%' }}
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </Form.Select>
                  </div>
                </div>
                
                {/* Add this preview box after your settings container */}
                <div className={`p-4 mb-4 rounded border ${darkMode ? 'bg-dark text-light' : 'bg-white'}`}>
                  <h4>Settings Preview</h4>
                  <p style={{ fontSize: `${fontSize}px` }}>
                    This text shows how your current settings will appear.
                    {darkMode ? " Dark mode is enabled." : " Light mode is enabled."}
                    {highContrast ? " High contrast is enabled." : ""}
                    Font size is set to {fontSize}px and UI density is {density}.
                  </p>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-primary">Primary Button</button>
                    <button className="btn btn-secondary">Secondary Button</button>
                  </div>
                </div>
                
                {/* Reset button */}
                <button 
                  className="btn btn-outline-danger mt-3"
                  onClick={() => {
                    setDarkMode(false);
                    setFontSize(16);
                    setHighContrast(false);
                    setColorTheme("default");
                    setDensity("comfortable");
                    setTimeout(() => applyAppearanceSettings(), 0);
                  }}
                >
                  Reset to Default Settings
                </button>

                {/* Apply button */}
                <button 
                  className="btn btn-primary mt-3 ms-3"
                  onClick={handleApplySettings}
                  disabled={!hasUnsavedChanges}
                >
                  Apply Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Instructor_Settings;
