import React, { useState, useEffect, useContext } from "react";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import { ProfileContext } from "../plugin/Context";

function Profile() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [profile, setProfile] = useContext(ProfileContext);
  const [profileData, setProfileData] = useState({
    image: "",
    full_name: "",
    about: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (event) => {
    setProfileData({
      ...profileData,
      [event.target.name]: event.target.value,
    });
  };
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];    // Check if file size is greater than 3MB (3 * 1024 * 1024 bytes)
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
    formdata.append("full_name", profileData.full_name || "");
    formdata.append("about", profileData.about || "");

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
      console.error("Error updating profile:", error.response?.data || error);
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
      <Sidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Profile Content */}
        <div style={{ padding: "20px" }}>
          <h4 className="mb-4">Profile Details</h4>
          <form onSubmit={handleFormSubmit}>
            <div className="d-flex align-items-center mb-4">
              <img src={imagePreview} alt="avatar" style={styles.avatar} />
              <div className="ms-3">                <h5>Change Profile Image</h5>
                <input
                  type="file"
                  className="form-control mt-2"
                  name="image"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <div style={{ fontSize: "12px", marginTop: "5px", color: "#666" }}>
                  Maximum file size: 3MB
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
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
            </div>            <button type="submit" className="btn btn-primary">
              Update Profile
            </button>
            {successMessage && (
              <span id="profile-message" style={styles.successMessage}>{successMessage}</span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
