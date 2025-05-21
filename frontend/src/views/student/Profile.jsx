import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import { ProfileContext } from "../plugin/Context";
import { FaMoon, FaSun, FaFont, FaEye, FaPalette } from 'react-icons/fa';
import { Form } from 'react-bootstrap';
import Toast from "../plugin/Toast";
import MobileNav from "./Partials/Mobile_Nav";

function Profile() {
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [subscriptionPackages, setSubscriptionPackages] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [showSettingsTabOnMobile, setShowSettingsTabOnMobile] = useState(false);

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

  const fetchUserSubscription = async () => {
    try {
      setUserSubscription(response.data);
    } catch (error) {
      setUserSubscription({
        is_active: false,
        package: null,
        include_all_courses: false,
        courses: [],
      });
    }
  };

  useEffect(() => {
    const userId = UserData()?.user_id;
    if (!userId) {
      navigate("/");
      return;
    }

    fetchProfile();
    fetchUserSubscription();
  }, []);

  // Add this useEffect to fetch subscription packages
  useEffect(() => {
    const fetchSubscriptionPackages = async () => {
      try {
        // Use the correct API endpoint with useAxios() instead of fetch
        const response = await useAxios().get('/landingpage/subscription-packages/');
        setSubscriptionPackages(response.data);
      } catch (error) {
        // console.error('Error fetching subscription packages:', error);
      }
    };
    
    // Only fetch packages if no active subscription
    if (!userSubscription?.is_active) {
      fetchSubscriptionPackages();
    }
  }, [userSubscription]);

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
    // Do NOT call applyAppearanceSettings() here
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
        // Do NOT manipulate the DOM here
      } catch (error) {
        // console.error("Error loading appearance settings:", error);
      }
    }
  }, []);

  // Check for subscription query parameters on page load
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = queryParams.get('subscription');
    
    if (subscriptionStatus === 'success') {
      setSuccessMessage("Your subscription was successfully activated!");
      // Refresh user subscription data
      fetchUserSubscription();
    } else if (subscriptionStatus === 'renewed') {
      setSuccessMessage("Your subscription was successfully renewed!");
      // Refresh user subscription data
      fetchUserSubscription();
    } else if (subscriptionStatus === 'canceled') {
      setSuccessMessage("Subscription payment was canceled.");
    }
    
    // Clear the query parameter from the URL
    if (subscriptionStatus) {
      window.history.replaceState({}, document.title, window.location.pathname);
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
  
  const handleColorThemeChange = (e) => {
    setColorTheme(e.target.value);
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

  // Function to handle subscription package purchase
  const handleSubscribePackage = async (pkg) => {
    try {
      setIsProcessingPayment(true);
      
      const userId = UserData()?.user_id;
      if (!userId) {
        toast.error("You must be logged in to purchase a subscription");
        return;
      }
      
      // Create checkout session directly with payment processor
      const checkoutResponse = await useAxios().post("/payment/create-checkout/", {
        amount: parseFloat(pkg.price) * 100, // Convert to cents
        item_name: `Subscription - ${pkg.name}`,
        customer_email: UserData()?.email,
        subscription_pkg_id: pkg.id, // Pass the package ID to identify which package
        is_subscription: true,  
        success_url: `${window.location.origin}/student/profile?subscription=success`,
        cancel_url: `${window.location.origin}/student/profile?subscription=canceled`
      });
      
      // console.log("Checkout response:", checkoutResponse.data);
      
      // Now redirect to the payment URL
      if (checkoutResponse.data && checkoutResponse.data.redirectUrl) {
        // console.log("Redirecting to:", checkoutResponse.data.redirectUrl);
        window.location = checkoutResponse.data.redirectUrl; // Use window.location assignment
      } else {
        throw new Error('No redirect URL received from payment processor');
      }
    } catch (error) {
      // console.error("Payment error:", error);
      toast.error("Payment processing error. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to handle subscription renewal
  const handleRenewSubscription = async () => {
    try {
      setIsProcessingPayment(true);

      const userId = UserData()?.user_id;
      if (!userId || !userSubscription?.package?.id) {
        Toast().fire({
          icon: "error",
          title: "Unable to renew subscription",
        });
        return;
      }


      // Use the same endpoint and payload as initial purchase
      const checkoutResponse = await useAxios().post("/payment/create-checkout/", {
        amount: parseFloat(userSubscription.package.price) * 100, // Convert to cents
        item_name: `Subscription Renewal - ${userSubscription.package.name}`,
        customer_email: UserData()?.email,
        subscription_pkg_id: userSubscription.package.id,
        is_subscription: true,
        success_url: `${window.location.origin}/student/profile?subscription=renewed`,
        cancel_url: `${window.location.origin}/student/profile?subscription=canceled`
      });

      if (checkoutResponse.data && checkoutResponse.data.redirectUrl) {
        Toast().fire({
          icon: "info",
          title: "Redirecting to payment page...",
        });
        window.location = checkoutResponse.data.redirectUrl;
      } else {
        throw new Error('No redirect URL received from payment processor');
      }
    } catch (error) {
      // console.error("Renewal error:", error);
      let errorMessage = "Renewal processing error. Please try again.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      Toast().fire({
        icon: "error",
        title: errorMessage
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleProfileChange = (event) => {
    setProfileData({
      ...profileData,
      [event.target.name]: event.target.value,
    });
  };  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
      // Check if file size is greater than 3MB (3 * 1024 * 1024 bytes)
    if (selectedFile && selectedFile.size > 3 * 1024 * 1024) {
      // Show error message with red styling for error
      const errorMsg = "File size exceeds 3MB limit. Please choose a smaller image.";
      setSuccessMessage(errorMsg);
      
      // Style the message as an error
      const messageElement = document.getElementById("profile-message");
      if (messageElement) {
        messageElement.style.color = "white";
        messageElement.style.backgroundColor = "#d9534f";
        messageElement.style.padding = "8px 12px";
        messageElement.style.borderRadius = "4px";
        messageElement.style.marginLeft = "10px";
      }
      
      // Reset styling and clear message after delay
      setTimeout(() => {
        setSuccessMessage("");
        if (messageElement) {
          messageElement.style.color = "green";
          messageElement.style.backgroundColor = "transparent";
          messageElement.style.padding = "0";
        }
      }, 5000);
      
      // Reset the file input
      event.target.value = null;
      return;
    }
    
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

  // Update the cancel subscription function

const cancelSubscription = async () => {
  try {
    // Simple browser confirm dialog
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription?\nYour access will continue until the end of your current billing period, but your subscription will not renew."
    );
    if (!confirmed) return;

    await useAxios().delete('/subscription/');

    Toast().fire({
      icon: "success",
      title: "Subscription cancelled. Your access will remain until the current period ends."
    });

    // Update UI to show subscription is cancelled but still active
    if (userSubscription) {
      setUserSubscription({
        ...userSubscription,
        auto_renew: false
      });
    }
  } catch (error) {
    // console.error("Error cancelling subscription:", error);
    Toast().fire({
      icon: "error",
      title: "Failed to cancel subscription. Please try again."
    });
  }
};

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 700;
      setIsMobile(mobile);
      if (!mobile) setShowSettingsTabOnMobile(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    mobileSettingsNav: {
      width: "100%",
      height: "100%",
      minHeight: "calc(100vh - 60px)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: darkMode ? "#181818" : "#f8f9fa",
      padding: "0 16px",
      gap: "16px",
    },
    mobileNavButton: {
      width: "100%",
      maxWidth: "350px",
      padding: "16px 0",
      borderRadius: "8px",
      border: "none",
      fontSize: "1.1rem",
      background: darkMode ? "#232323" : "#222",
      color: darkMode ? "#fff" : "#fff",
      fontWeight: 500,
      marginBottom: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      transition: "background 0.2s, color 0.2s",
      outline: "none",
      textAlign: "left",
      paddingLeft: "24px",
      position: "relative",
    },
    mobileNavButtonActive: {
      background: "#3973f7",
      color: "#fff",
    },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar - only show on non-mobile screens */}
      {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}

      {/* Main Content */}
      <div
        style={{
          ...styles.mainContent,
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? "80px" : "270px"),
        }}
      >
        {/* Header - only show on desktop */}
        {!isMobile && (
          <Header
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
        )}

        {/* Mobile Navigation */}
        {isMobile && <MobileNav />}

        {/* Profile Navigation and Content */}
        <div style={styles.profileContainer}>
          {/* Mobile: Show only nav if not in tab view */}
          {isMobile && !showSettingsTabOnMobile ? (
            <div style={styles.mobileSettingsNav}>
              <button
                style={{
                  ...styles.mobileNavButton,
                  ...(activeTab === "profile" ? styles.mobileNavButtonActive : {}),
                }}
                onClick={() => {
                  setActiveTab("profile");
                  setShowSettingsTabOnMobile(true);
                }}
              >
                Profile
              </button>
              <button
                style={{
                  ...styles.mobileNavButton,
                  ...(activeTab === "subscriptions" ? styles.mobileNavButtonActive : {}),
                }}
                onClick={() => {
                  setActiveTab("subscriptions");
                  setShowSettingsTabOnMobile(true);
                }}
              >
                Subscriptions
              </button>
              <button
                style={{
                  ...styles.mobileNavButton,
                  ...(activeTab === "Appearance" ? styles.mobileNavButtonActive : {}),
                }}
                onClick={() => {
                  setActiveTab("Appearance");
                  setShowSettingsTabOnMobile(true);
                }}
              >
                Appearance
              </button>
            </div>
          ) : (
            // Desktop: show nav + content, Mobile: show only content
            <>
              {/* Desktop nav */}
              {!isMobile && (
                <div className="settings-nav">
                  <button
                    className={`settings-nav-btn${activeTab === "profile" ? " active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    Profile
                  </button>
                  <button
                    className={`settings-nav-btn${activeTab === "subscriptions" ? " active" : ""}`}
                    onClick={() => setActiveTab("subscriptions")}
                  >
                    Subscriptions
                  </button>
                  <button
                    className={`settings-nav-btn${activeTab === "Appearance" ? " active" : ""}`}
                    onClick={() => setActiveTab("Appearance")}
                  >
                    Appearance
                  </button>
                </div>
              )}

              {/* Content Area */}
              <div style={styles.content}>
                {/* Mobile: Show back button */}
                {isMobile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "18px",
                      cursor: "pointer",
                      position: "relative",
                      minHeight: "40px",
                      width: "100%",
                      maxWidth: "350px",
                    }}
                    onClick={() => setShowSettingsTabOnMobile(false)}
                  >
                    <i
                      className="fas fa-chevron-left"
                      style={{
                        fontSize: "18px",
                        color: darkMode ? "#fff" : "#3973f7",
                        zIndex: 2,
                        position: "relative",
                        marginRight: "8px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "1.1rem",
                        color: darkMode ? "#fff" : "#3973f7",
                        fontWeight: 500,
                        zIndex: 2,
                        position: "relative",
                      }}
                    >
                      Back
                    </span>
                  </div>
                )}

                {/* Existing tab content logic */}
                {activeTab === "profile" && (
                  // ...profile tab content...
                  // (leave unchanged)
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
                          <h5>Change Profile Image</h5>                          <label
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
                          <div style={{ fontSize: "12px", marginTop: "5px", color: "#666" }}>
                            Maximum file size: 3MB
                          </div>
                          <input
                            type="file"
                            id="upload-avatar"
                            className="form-control mt-2"
                            name="image"
                            onChange={handleFileChange}
                            style={{
                              display: "none",
                            }}
                            accept="image/*"
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
                      </div>                      <button type="submit" className="btn btn-primary">
                        Update Profile
                      </button>
                      {successMessage && (
                        <span id="profile-message" style={styles.successMessage}>{successMessage}</span>
                      )}
                    </form>
                  </div>
                )}

                {activeTab === "subscriptions" && (
                  <div>
                    <h4 className="mb-4">Manage Subscriptions</h4>
                    {userSubscription?.is_active ? (
                      <div
                        style={{
                          position: "relative",
                          margin: "20px",
                          padding: "20px",
                          width: "300px",
                          borderRadius: "15px",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                          backgroundColor: "#f8f9fa",
                          color: "#000",
                          textAlign: "left",
                          fontFamily: "Arial, sans-serif",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "32px",
                            fontWeight: "bold",
                            marginBottom: "10px",
                            background: "linear-gradient(135deg, #EF4135, #0055A4)",
                            backgroundSize: "100% 150%",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {userSubscription?.package?.name || "N/A"}
                        </h2>
                        <p
                          style={{
                            fontSize: "16px",
                            marginBottom: "10px",
                            color:
                              userSubscription?.valid_until &&
                              new Date(userSubscription.valid_until) - new Date() <= 10 * 24 * 60 * 60 * 1000
                                ? "red"
                                : "#0bde00",
                          }}
                        >
                          <strong>Active Until:</strong>{" "}
                          {userSubscription?.valid_until
                            ? new Date(userSubscription.valid_until).toLocaleDateString()
                            : "No expiration date"}
                        </p>
                        <p style={{ fontSize: "16px", marginBottom: "10px" }}>
                          <strong>Included Courses:</strong>{" "}
                          {(userSubscription?.package?.include_all_courses === true || userSubscription?.package?.include_all_courses === 1)
                            ? "All Courses"
                            : "Refer to package details"}
                        </p>

                        {/* Cancel Subscription button always visible */}
                        <button
                          className="btn btn-danger mb-3"
                          onClick={cancelSubscription}
                          disabled={isProcessingPayment}
                          style={{ width: "100%" }}
                        >
                          Cancel Subscription
                        </button>

                        {/* Show renewal warning and button if expiring soon */}
                        {userSubscription?.valid_until &&
                          new Date(userSubscription.valid_until) - new Date() <= 10 * 24 * 60 * 60 * 1000 && (
                            <div className="alert alert-warning mb-3">
                              <strong>Your subscription is expiring soon!</strong>
                              <br />
                              Please renew to maintain access to your courses.
                            </div>
                          )}

                        {/* Renew Subscription button always visible */}
                        <button
                          className="btn btn-success"
                          onClick={handleRenewSubscription}
                          disabled={isProcessingPayment}
                          style={{ width: "100%" }}
                        >
                          {isProcessingPayment ? "Processing..." : "Renew Subscription"}
                        </button>
                      </div>
                    ) : (
                      <div className="subscription-packages-container">
                        <div className="mb-3">
                          <p>You do not have an active subscription. Choose a package below:</p>
                        </div>
                        
                        {/* Subscription packages grid */}
                        <div className="row">
                          {subscriptionPackages && subscriptionPackages.length > 0 ? (
                            subscriptionPackages.map(pkg => (
                              <div key={pkg.id} className="col-md-6 mb-4">
                                <div className="card shadow border-0 h-100" style={{
                                  backgroundColor: darkMode ? "#212121" : "#ffffff",
                                  color: darkMode ? "white" : "#333",
                                  borderRadius: "6px",
                                  border: darkMode ? "none" : "1px solid #e0e0e0"
                                }}>
                                  <div className="card-body text-center p-0 d-flex flex-column">
                                    <div className="p-4">
                                      <h3 className="mb-4">{pkg.name}</h3>
                                      <h2 className="display-4 fw-bold mb-0" style={{fontSize: "42px"}}>
                                        R{pkg.price}
                                        <span className={`text fs-6 fw-light ${darkMode ? "text" : "text-secondary"}`}>/month</span>
                                      </h2>
                                    </div>
                                    
                                    {/* Blue duration bar */}
                                    <div style={{backgroundColor: "#33b5e5", padding: "10px", color: "white", textAlign: "center"}}>
                                      Duration: {pkg.duration || pkg.duration} days
                                    </div>
                                    
                                    {/* Features list */}
                                    <div className="p-4 text-start flex-grow-1">
                                      <ul className="list-unstyled">
                                        {pkg.include_all_courses && (
                                          <li className="mb-3">✓ Access to premium content</li>
                                        )}
                                        <li className="mb-3">✓ Expert teacher support</li>
                                        <li className="mb-3">✓ Course access for {pkg.duration_days || pkg.duration} days</li>
                                        {/* Only render features that are included in the package */}
                                        {pkg.features && pkg.features.map((feature, index) => (
                                          feature.included && <li key={index} className="mb-3">✓ {feature.name}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    {/* Button area - always at bottom */}
                                    <div className="p-4 mt-auto">
                                      <button 
                                        style={{
                                          backgroundColor: "#dc3545",
                                          border: "none",
                                          borderRadius: "4px",
                                          color: "white",
                                          padding: "10px 24px",
                                          fontSize: "16px",
                                          fontWeight: "500",
                                          width: "100%"
                                        }}
                                        onClick={() => handleSubscribePackage(pkg)}
                                        disabled={isProcessingPayment}
                                        className="btn-get-started"
                                      >
                                        {isProcessingPayment ? 'Processing...' : 'Get Started'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-12 text-center py-5">
                              <p>No subscription packages found. Please check back later.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
