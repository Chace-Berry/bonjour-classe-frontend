import { useState, useEffect } from "react";
import { Route, Routes, BrowserRouter, useLocation } from "react-router-dom";
import React from "react";
import { useIdleTimer } from "react-idle-timer";
import Cookies from "js-cookie";
// Dashboard refresh utility is imported directly in the component to avoid circular dependencies

import { CartContext, ProfileContext } from "./views/plugin/Context";
import apiInstance from "./utils/axios";
import CartId from "./views/plugin/CartId";

import MainWrapper from "./layouts/MainWrapper";
import useAxios from "./utils/useAxios";
import UserData from "./views/plugin/UserData";

import Register from "../src/views/auth/Register";
import Login from "../src/views/auth/Login";
import Logout from "./views/auth/Logout";
import ForgotPassword from "./views/auth/ForgotPassword";
import CreateNewPassword from "./views/auth/CreateNewPassword";

import LandingPage from "./views/base/Landingpage";
import CourseDetail from "./views/base/CourseDetail";
import Cart from "./views/base/Cart";
import Checkout from "./views/base/Checkout";
import Success from "./views/base/Success";
import Search from "./views/base/Search";

import StudentDashboard from "./views/student/Dashboard";
import StudentCourses from "./views/student/Courses";
import StudentCourseDetail from "./views/student/CourseDetail";
import Wishlist from "./views/student/Wishlist";
import StudentProfile from "./views/student/Profile";
import Certificates from "./views/student/Certificates";
import Quizzes from "./views/student/Quizes";
import Messages from "./views/student/Messages";
import Assignments from "./views/student/Assignments";
import SecureTest from "./views/student/SecureTest";
import LoginModal from "./views/auth/Login";
import RegisterModal from "./views/auth/Register";
import InstructorDashboard from "./views/instructor/Dashboard";
import { isAccessTokenExpired, handleSessionExpiration } from "./utils/auth";
import DisableInspect from "./views/base/Partials/DisableInspect";
import DisableConsole from "./components/DisableConsole";
import Instructor_Settings from "./views/instructor/Instructor_Settings";
import AssignmentEditor from "./views/instructor/AssignmentEditor";
import './styles/appearance.css';
import NotFound from "./views/base/404";
import AssignmentManagement from "./views/instructor/AssignmentManagement";
import QuizEditor from "./views/instructor/QuizEditor";
import QuizManager from "./views/instructor/QuizManager";
import InstructorCourses from "./views/instructor/Courses";
import InstructorMessages from "./views/instructor/Messages";


function ThemeManager() {
  const location = useLocation();
  
  useEffect(() => {
    // Check if we're on the landing page or 404 page
    const isLandingPage = location.pathname === '/';
    const is404Page = location.pathname === '/404' || 
                     !location.pathname.match(/^\/(student|teacher|course-detail|cart|checkout|search)/);
    
    if (isLandingPage || is404Page) {
      // Force light mode on landing page and 404 page
      document.body.classList.remove('dark-mode');
    } else {
      // For other pages, restore user's dark mode preference from localStorage
      try {
        const savedSettings = localStorage.getItem('appearanceSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.darkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        }
      } catch (error) {
        // console.error("Error applying theme settings:", error);
      }
    }
  }, [location.pathname]);
  
  return null; // This component doesn't render anything
}

// Component to handle dashboard refresh on first visit
function DashboardRefresh() {
  const location = useLocation();
  
  useEffect(() => {
    // Use dynamic import instead of require to avoid "require is not defined" error
    import('./utils/dashboardRefresh').then(module => {
      // Check if we need to refresh the current dashboard
      module.checkAndRefreshDashboard(location.pathname);
    }).catch(error => {
      console.error("Error loading dashboard refresh utility:", error);
    });
  }, [location.pathname]);
  
  return null; // This component doesn't render anything
}

function App() {
  const [cartCount, setCartCount] = useState(0);
  const [profile, setProfile] = useState([]);
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);

  // Function to apply appearance settings globally
  const applyAppearanceSettings = (settings) => {
    // console.log("Applying global appearance settings:", settings);
    
    // Check if we're on the landing page or 404 page - never apply dark mode to these
    const isLandingPage = window.location.pathname === '/';
    const is404Page = window.location.pathname === '/404' || 
                     document.title.includes('404') || 
                     document.body.classList.contains('not-found-page');
    
    // Remove all theme classes first
    document.body.classList.remove('dark-mode', 'high-contrast');
    
    // Apply dark mode class only if true AND not on excluded pages
    if (settings.dark_mode && !isLandingPage && !is404Page) {
      document.body.classList.add('dark-mode');
    }
    
    // Apply high contrast only if true AND not on excluded pages  
    if (settings.high_contrast && !isLandingPage && !is404Page) {
      document.body.classList.add('high-contrast');
    }
    
    // Apply font size to the document root
    document.documentElement.style.fontSize = `${settings.font_size || 16}px`;
    
    // Apply color theme and density as data attributes
    document.body.setAttribute('data-theme', settings.color_theme || 'default');
    document.body.setAttribute('data-density', settings.density || 'comfortable');
    
    // Save to localStorage for offline/future use
    localStorage.setItem('appearanceSettings', JSON.stringify({
      darkMode: settings.dark_mode,
      fontSize: settings.font_size || 16,
      highContrast: settings.high_contrast,
      colorTheme: settings.color_theme || 'default',
      density: settings.density || 'comfortable'
    }));
  };

  // Load appearance settings from backend or localStorage
  const loadAppearanceSettings = async () => {
    try {
      const userData = UserData();
      
      if (userData && userData.user_id) {
        // Try to load from backend first
        const api = useAxios();
        const response = await api.get('user/appearance-settings/');
        
        if (response.data) {
          applyAppearanceSettings(response.data);
          // console.log("Appearance settings loaded from backend");
          setAppearanceLoaded(true);
          return;
        }
      }
    } catch (error) {
      // console.log("Could not load appearance settings from backend:", error);
    }
    
    // Fallback to localStorage if backend fails or user not logged in
    try {
      const savedSettings = localStorage.getItem('appearanceSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        applyAppearanceSettings({
          dark_mode: settings.darkMode,
          font_size: settings.fontSize,
          high_contrast: settings.highContrast,
          color_theme: settings.colorTheme,
          density: settings.density
        });
        // console.log("Appearance settings loaded from localStorage");
      }
    } catch (error) {
      // console.error("Error loading appearance settings from localStorage:", error);
    }
    
    setAppearanceLoaded(true);
  };

  useEffect(() => {
    // Load appearance settings first
    loadAppearanceSettings();
    
    // Always try to get cart info
    apiInstance.get(`course/cart-list/${CartId()}/`).then((res) => {
      setCartCount(res.data?.length);
    }).catch(error => {
      // console.log("Cart error (expected if not logged in):", error);
    });

    // Only try to get profile if we have a user_id
    const userData = UserData();
    if (userData && userData.user_id) {
      useAxios()
        .get(`user/profile/${userData.user_id}/`)
        .then((res) => {
          setProfile(res.data);
        })
        .catch(error => {
          // console.log("Profile error:", error);
        });
    }
  }, []);

  const onIdle = () => {
    const accessToken = Cookies.get("access_token");

    if (accessToken && isAccessTokenExpired(accessToken)) {
      handleSessionExpiration(); 
    }
  };

  const idleTimer = useIdleTimer({
    timeout: 1000 * 60 * 15, 
    onIdle,
    debounce: 500,
  });

  return (
    <CartContext.Provider value={[cartCount, setCartCount]}>
      <ProfileContext.Provider value={[profile, setProfile]}>
        <BrowserRouter>
          <MainWrapper>
            {/* Render the modals globally */}
            <LoginModal />
            <RegisterModal />
            <ForgotPassword />

            {/* Add DisableInspect globally */}
            <DisableInspect />
            <DisableConsole />

            {/* Add the CartId globally */}

            <ThemeManager />
            <DashboardRefresh />

            <div
              style={{
                position: "relative",
                userSelect: "none", 
                overflow: "hidden",
              }}
            >
              {/* Wrap all routes inside <Routes> */}
              <Routes>
                {/* Base Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/course-detail/:slug/" element={<CourseDetail />} />
                <Route path="/cart/" element={<Cart />} />
                <Route path="/checkout/:order_oid/" element={<Checkout />} />
                <Route
                  path="/payment-success/:order_oid/"
                  element={<Success />}
                />
                <Route path="/search/" element={<Search />} />

                {/* Student Routes */}
                <Route
                  path="/student/dashboard/"
                  element={<StudentDashboard />}
                />
                <Route path="/student/secure-test/:assignmentId/" element={<SecureTest />} />
                <Route path="/student/courses/" element={<StudentCourses />} />
                <Route path="/student/assignments/" element={<Assignments />} />
                <Route
                  path="/student/courses/:enrollment_id/"
                  element={<StudentCourseDetail />}
                />
                <Route path="/student/wishlist/" element={<Wishlist />} />
                <Route path="/student/Settings/" element={<StudentProfile />} />
                <Route path="/student/certificates/" element={<Certificates />} />
                <Route path="/student/quiz/" element={<Quizzes />} />
                {/* Message Routes */}
                <Route
                  path="/student/messages/"
                  element={<Messages />}
                />
                {/* Teacher Routes */}
                <Route path="/teacher/dashboard" element={<InstructorDashboard />} />
                <Route path="/teacher/Settings/" element={<Instructor_Settings />} />
                <Route path="/teacher/assignment/editor/:assignmentId/" element={<AssignmentEditor />} />
                <Route path="/teacher/assignment/editor/" element={<AssignmentEditor />} />
                <Route path="/teacher/assignments/" element={<AssignmentManagement/>} />
                <Route path="/teacher/quiz/editor/:quizId/" element={<QuizEditor />} />
                <Route path="/teacher/quiz/editor/" element={<QuizEditor />} />
                <Route path="/teacher/quiz/" element={<QuizManager />} />
                <Route path="/teacher/courses" element={<InstructorCourses />} />
                <Route path="/teacher/courses/:teacherId/" element={<InstructorCourses />} />
                <Route path="/teacher/messages" element={<InstructorMessages />} />
                <Route path="*" element={<NotFound />} />

              </Routes>
            </div>
          </MainWrapper>
        </BrowserRouter>
      </ProfileContext.Provider>
    </CartContext.Provider>
  );
}

export default App;
