import React, { useContext, useState, useRef, useEffect } from "react";
import { ProfileContext } from "../../plugin/Context";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import useAxios from "../../../utils/useAxios"; // adjust path if needed
import UserData from "../../plugin/UserData"; // or correct path

function Header({ sidebarCollapsed, toggleSidebar }) {
  const [profile] = useContext(ProfileContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch notifications for the current user
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = UserData()?.user_id;
        if (userId) {
          const res = await useAxios().get(`/notifications/user/${userId}/`);
          setNotifications(res.data);
        }
      } catch (err) {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  const handleSignOut = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    navigate("/"); 
  };

  const markAllAsRead = async () => {
    try {
      const userId = UserData()?.user_id;
      if (userId) {
        await useAxios().post(`/notifications/read-all/`, { user_id: userId });
        // Optionally update local state to mark as read
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, seen: true }))
        );
      }
    } catch (err) {
      // Handle error silently
    }
  };

  const handleShowNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) markAllAsRead();
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header
      className="dashboard-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        backgroundColor: "#fff",
        padding: "10px 20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
      }}
    >
      {/* Group hamburger and welcome text together */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Only show hamburger on non-mobile displays */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              marginRight: "15px",
            }}
          >
            ☰
          </button>
        )}
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
          Welcome back, {profile?.full_name || "User"}!
        </h2>
      </div>

      {/* User and Notification Dropdowns */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Notifications */}
        <div ref={notificationsRef} style={{ position: "relative" }}>
          <button
            onClick={handleShowNotifications}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <i className="fas fa-bell" style={{ fontSize: "20px" }}></i>
            {notifications.some((n) => !n.seen) && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "12px",
                }}
              >
                {notifications.filter((n) => !n.seen).length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "30px",
                right: 0,
                backgroundColor: "#fff",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                width: "300px",
                zIndex: 1000,
                color: "black",
                maxHeight: "350px",
                overflowY: "auto", // <-- Make scrollable
              }}
            >
              <ul style={{ listStyle: "none", padding: "10px", margin: 0 }}>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <li
                      key={index}
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid #f0f0f0",
                        background: notification.seen ? "#fff" : "#f5f7fa",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {notification.title || notification.type || "Notification"}
                      </div>
                      {notification.content && (
                        <div style={{ fontSize: "0.95em", color: "#555" }}>
                          {notification.content}
                        </div>
                      )}
                      {notification.date && (
                        <div style={{ fontSize: "0.8em", color: "#aaa" }}>
                          {new Date(notification.date).toLocaleString()}
                        </div>
                      )}
                    </li>
                  ))
                ) : (
                  <li style={{ textAlign: "center", padding: "10px 0" }}>
                    No notifications
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        {/* User profile image only, no dropdown */}
        <img
          src={
            profile?.image ||
            "https://imgs.search.brave.com/RDlr00DIZWKKhPu4ymE1K_IzmblJm8CbiuCSzm-xnQ4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAxLzA3LzQzLzQ1/LzM2MF9GXzEwNzQz/NDUxMV9pYXJGMno4/OGM2RHM2QWxndHdv/dEhTQWt0V0NkWU9u/Ny5qcGc"
          }
          alt="User"
          className="rounded-circle"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
            cursor: "pointer",
          }}
        />
      </div>
    </header>
  );
}

export default Header;
