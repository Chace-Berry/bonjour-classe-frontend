import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie"; // Add import for Cookies

// Main nav items (no assignments/settings/logout)
const navItems = [
  { label: "Courses", icon: <i className="bi bi-book" />, path: "/teacher/courses" },
  { label: "Quizzes", icon: <i className="bi bi-question-circle" />, path: "/teacher/quiz" },
  { label: "Home", icon: <i className="bi bi-house" />, path: "/teacher/dashboard" },
  { label: "Messages", icon: <i className="bi bi-chat-dots" />, path: "/teacher/messages" },
];

// Define the handleSignOut function as a standalone function
const handleSignOut = (navigate) => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  navigate("/"); 
};

const moreNav = [
  { label: "Assignments", icon: <i className="bi bi-pencil" />, path: "/teacher/assignments" },
  { label: "Settings", icon: <i className="bi bi-gear" />, path: "/teacher/settings" },
  { label: "Logout", icon: <i className="bi bi-box-arrow-right" />, action: "logout" },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef();

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (showMore && moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMore(false);
      }
    }
    if (showMore) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMore]);

  // Helper to render nav buttons
  const renderNavBtns = (items, btnClass = "mobile-nav-btn", closeMore = true) =>
    items.map((item) => {
      const isActive = location.pathname.startsWith(item.path);
      return (
        <button
          key={item.path || item.label}
          onClick={() => {
            if (item.action === "logout") {
              handleSignOut(navigate);
            } else if (item.path) {
              if (closeMore) setShowMore(false);
              navigate(item.path);
            }
          }}
          className={`${btnClass}${isActive ? " active" : ""}`}
          aria-label={item.label}
          type="button"
        >
          <span className="mobile-nav-icon">{item.icon}</span>
          <span className="mobile-nav-label">{item.label}</span>
        </button>
      );
    });

  return (
    <>
      {/* Main Nav Bar */}
      <nav className="mobile-nav-bar">
        <div className="mobile-nav-scroll">
          {renderNavBtns(navItems)}
          <button
            className={`mobile-nav-btn${showMore ? " active" : ""}`}
            aria-label="More"
            type="button"
            onClick={() => setShowMore(true)}
          >
            <span className="mobile-nav-icon"><i className="bi bi-three-dots" /></span>
            <span className="mobile-nav-label">More</span>
          </button>
        </div>
      </nav>
      {/* Slide-in More Menu */}
      <div
        ref={moreRef}
        className={`mobile-nav-slide-menu${showMore ? " open" : ""}`}
      >
        <div className="mobile-nav-slide-content">
          {renderNavBtns(moreNav, "mobile-nav-btn", true)}
          <button
            className="mobile-nav-btn"
            aria-label="Back"
            type="button"
            onClick={() => setShowMore(false)}
          >
            <span className="mobile-nav-icon"><i className="bi bi-chevron-left" /></span>
            <span className="mobile-nav-label">Back</span>
          </button>
        </div>
      </div>
      <style>{`
        .mobile-nav-bar {
          position: fixed;
          left: 0;
          bottom: 0;
          width: 100vw;
          height: 64px;
          background: #232323;
          border-top: 1.5px solid #23272f;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          box-shadow: 0 -2px 16px rgba(0,0,0,0.10);
          border-radius: 18px 18px 0 0;
          padding: 0;
          overflow: hidden;
        }
        .mobile-nav-scroll {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100%;
          justify-content: space-evenly;
        }
        .mobile-nav-btn {
          background: none!important;
          border: none;
          outline: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #bdbdbd;
          font-size: 13px;
          font-weight: 500;
          min-width: 64px;
          height: 100%;
          transition: color 0.18s;
          position: relative;
          cursor: pointer;
          padding: 0 12px;
          border-radius: 10px;
        }
        .mobile-nav-btn.active {
          color: #4F8CFF;
          font-weight: 700;
        }
        .mobile-nav-btn.active .mobile-nav-icon {
          color: #4F8CFF;
        }
        .mobile-nav-btn:active {
          background: #232323;
        }
        .mobile-nav-icon {
          font-size: 20px;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.18s;
        }
        .mobile-nav-label {
          font-size: 11px;
          margin-top: 1px;
          letter-spacing: 0.1em;
        }
        /* Slide-in More Menu */
        .mobile-nav-slide-menu {
          position: fixed;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 64px;
          background: #232323;
          border-top: 1.5px solid #23272f;
          border-radius: 18px 18px 0 0;
          z-index: 2101;
          display: flex;
          align-items: center;
          pointer-events: none;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(.77,0,.18,1);
          overflow: hidden;
        }
        .mobile-nav-slide-menu.open {
          transform: translateX(0%);
          pointer-events: auto;
        }
        .mobile-nav-slide-content {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100%;
          justify-content: space-evenly;
          align-items: center;
        }
        /* Overlay removed */
        @media (min-width: 700px) {
          .mobile-nav-bar, .mobile-nav-slide-menu {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}