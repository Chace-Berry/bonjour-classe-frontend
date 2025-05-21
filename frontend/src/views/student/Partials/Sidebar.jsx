import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";

function Sidebar({ sidebarCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation(); 

  const handleSignOut = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    navigate("/"); 
  };

  const isActive = (path) => location.pathname === path; 

  return (
    <div
      className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
      style={{
        position: "fixed",
        top: "10px", 
        left: "10px", 
        height: "calc(100vh - 20px)", 
        width: sidebarCollapsed ? "60px" : "250px", 
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderRadius: "15px", 
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", 
        transition: "width 0.3s ease",
        zIndex: 1000,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Main nav - direct child */}
      <ul className="list-unstyled" style={{ padding: 0, margin: 0 }}>
        <li className="nav-item">
          <Link
            className={`nav-link ${isActive("/student/dashboard") ? "active" : ""}`}
            to="/student/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start", 
            }}
          >
            <i
              className="bi bi-house"
              style={{
                fontSize: "20px",
                marginRight: sidebarCollapsed ? "0" : "10px", 
              }}
            ></i>
            {!sidebarCollapsed && <span>Home</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className={`nav-link ${isActive("/student/courses") ? "active" : ""}`}
            to="/student/courses"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <i
              className="bi bi-book"
              style={{
                fontSize: "20px",
                marginRight: sidebarCollapsed ? "0" : "10px",
              }}
            ></i>
            {!sidebarCollapsed && <span>Enrolled Courses</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className={`nav-link ${isActive("/student/assignments") ? "active" : ""}`}
            to="/student/assignments"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <i
              className="bi bi-pencil"
              style={{
                fontSize: "20px",
                marginRight: sidebarCollapsed ? "0" : "10px",
              }}
            ></i>
            {!sidebarCollapsed && <span>Assignments</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className={`nav-link ${isActive("/student/quiz") ? "active" : ""}`}
            to="/student/quiz"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <i
              className="bi bi-question-circle"
              style={{
                fontSize: "20px",
                marginRight: sidebarCollapsed ? "0" : "10px",
              }}
            ></i>
            {!sidebarCollapsed && <span>Quiz</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className={`nav-link ${isActive("/student/messages") ? "active" : ""}`}
            to="/student/messages"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <i
              className="bi bi-chat-dots"
              style={{
                fontSize: "20px",
                marginRight: sidebarCollapsed ? "0" : "10px",
              }}
            ></i>
            {!sidebarCollapsed && <span>Messages</span>}
          </Link>
        </li>
      </ul>

      {/* Spacer to push bottom nav to the bottom */}
      <div style={{ flex: 1 }} />

      {/* Bottom nav - direct child */}
      <ul className="list-unstyled" style={{ padding: 0, margin: 0, marginBottom: "10px" }}>
        <li className="nav-item">
          <Link
            className={`nav-link ${isActive("/student/settings") ? "active" : ""}`}
            to="/student/settings"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <i
              className="bi bi-gear"
              style={{
                fontSize: "20px",
                marginRight: sidebarCollapsed ? "0" : "10px",
              }}
            ></i>
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>
        </li>
        <li className="nav-item">
          <button
            className="nav-link btn btn-link text-start"
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }}
          >
            <i
              className="bi bi-box-arrow-right"
              style={{
                fontSize: "20px",
                marginRight: sidebarCollapsed ? "0" : "10px",
              }}
            ></i>
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </li>
      </ul>

      {/* Sidebar CSS */}
      <style>{`
        .nav-link {
          padding: 10px;
          border-radius: 8px;
          color: black;
          text-decoration: none;
          transition: background-color 0.3s ease, color 0.3s ease;
          width: 100%;
        }

        .nav-link:hover {
          background-color: rgb(3, 3, 153);
          color: white;
        }

        .nav-link:hover i,
        .nav-link:hover span {
          color: white;
        }

        .nav-link.active {
          background-color: rgb(140, 0, 0);
          font-weight: bold;
          color: white;
        }

        .nav-link.active i,
        .nav-link.active span {
          color: white;
        }

        .nav-item {
          width: 100%;
        }

        .sidebar.collapsed .nav-link {
          justify-content: center;
        }

        .sidebar.collapsed .nav-link i {
          margin-right: 0;
        }

        .sidebar.collapsed .nav-link span {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;