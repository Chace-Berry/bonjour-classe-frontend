import React, { useState, useEffect, useRef } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import useAxios from "../../utils/useAxios";
import InstructorSidebar from "./Partials/InstructorSidebar";
import Header from "./Partials/Header";
import Cookies from "js-cookie";
import UserData from "../plugin/UserData";
import CalendarComponent from "./Partials/InstuctorCalendarComponent";
import LoadingScreen from "../../components/LoadingScreen";
import { FaPlus, FaFileAlt, FaQuestionCircle, FaEnvelope, FaTimes, FaTrash, FaPencilAlt } from "react-icons/fa";
import dayjs from "dayjs";
import { Modal, Button, Form } from "react-bootstrap";
import { FaCalendarAlt, FaVideo, FaUsers, FaUserFriends } from "react-icons/fa";
import { toast } from "react-toastify";
import { hasVisitedPath } from "../../utils/dashboardRefresh"; // Import dashboard refresh utility

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function InstructorDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [stats, setStats] = useState({});
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentCertificates, setRecentCertificates] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false); // Track if we should show refresh message
  const [todayEvents, setTodayEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isLiveSession, setIsLiveSession] = useState(false);
  const [eventData, setEventData] = useState({
    name: "",
    date: "",
    time: "",
    description: "",
    platform: "Other",
    invite_link: "",
    groups: [],
    users: [],
    send_to_all: false
  });
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const api = useAxios();
  
  // Function to load appearance settings from backend
  const loadAppearanceSettings = async () => {
    try {
      const response = await api.get('/user/appearance-settings/');
      if (response.data) {
//        console.log("Fetched appearance settings:", response.data);
        applyAppearanceSettings(response.data);
      }
    } catch (error) {
//      console.error("Failed to fetch appearance settings:", error);
      // Fall back to local storage if API fails
      const storedDarkMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(storedDarkMode);
    }
  };
  
  // Function to apply the settings
  const applyAppearanceSettings = (settings) => {
    // Apply dark mode
    if (settings.dark_mode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Update component state
    setDarkMode(settings.dark_mode);
    
    // Apply any other settings you might have
    if (settings.font_size) {
      document.documentElement.style.fontSize = `${settings.font_size}px`;
    }
    
    if (settings.high_contrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };
  
  // Load settings when component mounts
  useEffect(() => {
    loadAppearanceSettings();
    
    // Set up observer to monitor changes to body class
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkMode = document.body.classList.contains('dark-Mode');
          setDarkMode(isDarkMode);
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSignOut = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token"); 
    navigate("/");
  };

  // Function to get the last 3 months
  const getLastThreeMonths = () => {
    const months = ["January", "February", "March", "April", "May", "June", 
                  "July", "August", "September", "October", "November", "December"];
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed (0 = January)
    
    // Get the current month and 2 previous months
    return [
      months[(currentMonth + 10) % 12], // 2 months ago
      months[(currentMonth + 11) % 12], // 1 month ago
      months[currentMonth]              // Current month
    ];
  };

  // Add these states to track selected day events
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);

  const handleDayClick = (day) => {
    const formattedDate = day.format("YYYY-MM-DD");
    
    // Find events for the selected day
    const dayEvents = events.filter(event => event.event_date === formattedDate);
    
    if (dayEvents.length > 0) {
//      console.log("Events for", formattedDate, dayEvents);
      setSelectedDate(formattedDate);
      setSelectedDayEvents(dayEvents);
      setShowDayEventsModal(true);
    } else {
      // If no events, create a new one
      setIsEditMode(false);
      setSelectedEventId(null);
      setEventData({
        ...eventData,
        date: formattedDate
      });
      setShowEventModal(true);
    }
  };
  
  // Quick action handlers
  const handleCreateAssignment = () => navigate('/instructor/assignments/create');
  const handleCreateQuiz = () => navigate('/instructor/quizzes/create');
  const handleSendMessage = () => navigate('/instructor/messages');
  const handleAddEvent = () => {
    setIsEditMode(false);
    setSelectedEventId(null);
    // Reset form data
    setEventData({
      name: "",
      date: "",
      time: "",
      description: "",
      platform: "Other",
      invite_link: "",
      groups: [],
      users: [],
      send_to_all: false
    });
    setIsLiveSession(false);
    setShowEventModal(true);
    
    // Fetch available groups and users
    fetchGroupsAndUsers();
  };
  
  // Handle opening the modal in edit mode
  const handleEditEvent = async (eventId) => {
    try {
      setIsEditMode(true);
      setSelectedEventId(eventId);
      setIsLoading(true);
      
      // Fetch event data from API
      const response = await api.get(`events/${eventId}/`);
      const event = response.data;
      
      // Check if this is a live session
      const isLiveVideoSession = event.platform && event.platform !== "other";
      setIsLiveSession(isLiveVideoSession);
      
      // Parse the date and time from event_datetime
      const eventDateTime = new Date(event.date || event.event_datetime);
      const formattedDate = eventDateTime.toISOString().split('T')[0];
      
      // Format the time (HH:MM)
      const hours = eventDateTime.getHours().toString().padStart(2, '0');
      const minutes = eventDateTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      // Set the event data in the form
      setEventData({
        name: event.name || "",
        date: formattedDate,
        time: formattedTime,
        description: event.description || "",
        platform: event.platform || "other",
        invite_link: event.invite_link || "",
        groups: event.groups?.map(g => g.id || g) || [],
        users: event.users?.map(u => u.id || u) || [],
        send_to_all: event.send_to_all || false
      });
      
      // Fetch available groups and users
      await fetchGroupsAndUsers();
      
      // Show the modal
      setShowEventModal(true);
    } catch (error) {
//      console.error("Error fetching event data:", error);
      toast.error("Failed to load event data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch groups and users for dropdowns
  const fetchGroupsAndUsers = async () => {
    try {
//      console.log("Fetching groups and users...");
      
      // Use the correct endpoint we created
      const response = await api.get('groups/');
      
      // Make sure we're handling the response properly
      if (response.data && response.data.groups) {
        setAvailableGroups(response.data.groups);
      } else {
        // Fallback to empty array if data format is unexpected
        setAvailableGroups([]);
      }
      
      if (response.data && response.data.users) {
        setAvailableUsers(response.data.users);
      } else {
        setAvailableUsers([]);
      }
      
//      console.log("Groups and users loaded:", response.data);
    } catch (error) {
//      console.error("Error fetching groups and users:", error);
      // Set to empty arrays on error to prevent map errors
      setAvailableGroups([]);
      setAvailableUsers([]);
    }
  };
  
  // Fetch event data for editing
  const fetchEventData = async (eventId) => {
    try {
      const response = await api.get(`events/${eventId}/`);
      const event = response.data;
      
      // Check if this is a live session
      const hasLinkOrPlatform = event.invite_link || event.platform !== "Other";
      setIsLiveSession(hasLinkOrPlatform);
      
      // Format date and time
      const eventDate = new Date(event.event_datetime);
      const formattedDate = eventDate.toISOString().split('T')[0];
      const formattedTime = eventDate.toTimeString().slice(0, 5);
      
      setEventData({
        name: event.name || "",
        date: formattedDate,
        time: formattedTime,
        description: event.description || "",
        platform: event.platform || "Other",
        invite_link: event.invite_link || "",
        groups: event.groups || [],
        users: event.users || [],
        send_to_all: event.send_to_all || false
      });
    } catch (error) {
//      console.error("Error fetching event data:", error);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setEventData({ ...eventData, [name]: checked });
    } else {
      setEventData({ ...eventData, [name]: value });
    }
  };
  
  // Handle multiselect for groups and users
  const handleMultiSelect = (e, fieldName) => {
    const options = Array.from(e.target.selectedOptions).map(option => option.value);
    setEventData({ ...eventData, [fieldName]: options });
  };
  
  // Toggle live session option
  const handleToggleLiveSession = (e) => {
    setIsLiveSession(e.target.checked);
    
    if (!e.target.checked) {
      setEventData({ 
        ...eventData, 
        platform: "Other",
        invite_link: ""
      });
    }
  };
  
  // Handle form submission with explicit user info
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    // Make sure date and time are valid before combining
    if (!eventData.date || !eventData.time) {
      toast.error("Date and time are required");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Combine date and time
      const dateTime = new Date(`${eventData.date}T${eventData.time}`);
      
      // Prepare the data for API
      const submitData = {
        name: eventData.name,
        date: dateTime.toISOString(),
        description: eventData.description || "",
        platform: isLiveSession ? eventData.platform : "other",
        invite_link: isLiveSession ? eventData.invite_link : "",
        send_to_all: eventData.send_to_all || false,
        users: Array.isArray(eventData.users) ? eventData.users : [],
        groups: Array.isArray(eventData.groups) ? eventData.groups : []
      };
      
//      console.log(`${isEditMode ? "Updating" : "Creating"} event with data:`, submitData);
      
      const token = Cookies.get("access_token");
      let response;
      
      if (isEditMode && selectedEventId) {
        // Update existing event
        response = await api.put(`events/${selectedEventId}/`, submitData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success("Event updated successfully!");
      } else {
        // Create new event
        response = await api.post('teacher/submit-event/', submitData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success("Event created successfully!");
      }
      
      if (response.status === 201 || response.status === 200) {
        // Close modal first
        setShowEventModal(false);
        
        // Refresh dashboard data
        fetchDashboardData();
        
        // Explicitly refresh the calendar component
        // Use a timeout to ensure the event is dispatched after state updates
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('calendar-refresh'));
//          console.log("Calendar refresh event dispatched");
        }, 100);
      }
    } catch (error) {
//      console.error(`Error ${isEditMode ? "updating" : "creating"} event:`, error);
      
      // Show detailed error message if available
      if (error.response?.data?.errors) {
//        console.error("Validation errors:", error.response.data.errors);
      }
      
      toast.error(`Failed to ${isEditMode ? "update" : "create"} event. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle today button click
  const handleSetToday = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setEventData({ ...eventData, date: formattedDate });
  };
  
  // Handle now button click
  const handleSetNow = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    setEventData({ ...eventData, time: formattedTime });
  };

  // Navigation handlers for widgets
  const navigateToStudents = () => navigate('/instructor/students');
  const navigateToAssignments = () => navigate('/instructor/assignments/to-grade');
  const navigateToQuizzes = () => navigate('/instructor/quizzes');
  const navigateToCertificates = () => navigate('/instructor/certificates');

  const fetchProfile = async () => {
    try {
      const response = await api.get(`user/profile/${UserData()?.user_id}/`);
      setUser(response.data);
    } catch (error) {
//      console.error("Error fetching profile:", error);
      if (error.response && error.response.status === 401) {
        navigate("/");
      }
    }
  };

  const fetchDashboardData = async () => {
    const teacherId = UserData()?.teacher_id;
    if (!teacherId) {
      navigate("/404"); // Navigate to 404 page instead of home
      return;
    }

    try {
      // Fetch teacher dashboard data
      const dashboardResponse = await api.get(`teacher/dashboard/${teacherId}/`);
      
      setStats({
        total_students: dashboardResponse.data.stats?.total_students || 0,
        assignments_to_grade: dashboardResponse.data.stats?.assignments_to_grade || 0,
        quizzes_created: dashboardResponse.data.stats?.quizzes_created || 0,
        certificates_issued: dashboardResponse.data.stats?.certificates_issued || 0,
        monthly_submissions: dashboardResponse.data.monthly_submissions || [],
        monthly_logins: dashboardResponse.data.monthly_logins || [],
        monthly_quizzes: dashboardResponse.data.monthly_quizzes || [],
        activity_breakdown: dashboardResponse.data.activity_breakdown || []
      });

      // Set certificates and activity data
      setRecentCertificates(dashboardResponse.data.recent_certificates || []);
      setRecentActivity(dashboardResponse.data.recent_activity || []);
      setTodayEvents(dashboardResponse.data.upcoming_events || []);
      
      // Set events for calendar
      setEvents(dashboardResponse.data.all_events || []);

      // Fetch notifications
      const notificationsResponse = await api.get(`notifications/`);
      setNotifications(notificationsResponse.data);
      
    } catch (error) {
//      console.error("Error fetching dashboard data:", error);
    }
  };

  const refreshUserData = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  };

  // Add this function to fetch allowed platform choices
  const fetchAllowedPlatforms = async () => {
    try {
      const response = await api.get('events/allowed-platforms/');
    } catch (error) {
//      console.error("Error fetching platforms:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAllowedPlatforms(); 
  }, []);
  useEffect(() => {
    const initializeDashboard = async () => {
      // Check if this is the second load after a forced refresh
      const wasRefreshed = sessionStorage.getItem('refreshed_instructor_dashboard');
      
      if (wasRefreshed) {
        // Clear the refresh flag
        sessionStorage.removeItem('refreshed_instructor_dashboard');
        // Show the refresh message briefly
        setShowRefreshMessage(true);
        setTimeout(() => {
          setShowRefreshMessage(false);
        }, 3000);
      } else {
        // Check if this was a force refresh
        const path = '/teacher/dashboard';
        const visitKey = `visited_${path.replace(/\//g, '_')}`;
        const justVisited = sessionStorage.getItem(visitKey) === 'true';
        
        if (justVisited) {
          // Set a flag to show the refresh message on the next load
          sessionStorage.setItem('refreshed_instructor_dashboard', 'true');
        }
      }

      await fetchProfile();
      await fetchDashboardData();

      // Force a loading screen (reduced to 1.5 seconds for better UX)
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);

      return () => clearTimeout(timer);
    };

    initializeDashboard();

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Automatically refresh user data once after login
    if (!user) {
      refreshUserData();
    }
  }, [user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isRefreshing) {
    return <p>Refreshing user data...</p>;
  }

  // Class activity trends showing submissions, logins, quiz attempts
  const lineChartData = {
    labels: getLastThreeMonths(),
    datasets: [
      {
        label: "Submissions",
        data: stats.monthly_submissions ? stats.monthly_submissions.slice(-3) : [0, 0, 0],
        borderColor: "#032794",
        backgroundColor: "rgba(3, 39, 148, 0.2)",
        tension: 0.4,
      },
      {
        label: "Logins",
        data: stats.monthly_logins ? stats.monthly_logins.slice(-3) : [0, 0, 0],
        borderColor: "#15A362",
        backgroundColor: "rgba(21, 163, 98, 0.2)",
        tension: 0.4,
      },
      {
        label: "Quiz Attempts",
        data: stats.monthly_quizzes ? stats.monthly_quizzes.slice(-3) : [0, 0, 0],
        borderColor: "#8c0101",
        backgroundColor: "rgba(140, 1, 1, 0.2)",
        tension: 0.4,
      }
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: darkMode ? "#f0f0f0" : "#666"
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} Activities`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? "#f0f0f0" : "#666"
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? "#444" : "#f0f0f0",
        },
        ticks: {
          color: darkMode ? "#f0f0f0" : "#666"
        },
      },
    },
  };

  
  const doughnutChartData = {
    labels: ["Assignments", "Quizzes", "Discussions", "Content"],
    datasets: [
      {
        data: stats.activity_breakdown || [], 
        backgroundColor: ["#032794", "#8c0101", "#15A362", "#FFC107"],
        hoverBackgroundColor: ["#021c68", "#5c0000", "#0f8049", "#e0aa00"],
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: {
            size: 11
          },
          color: darkMode ? "#f0f0f0" : "#666"
        }
      },
    },
    cutout: "70%",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <InstructorSidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginTop: "40px",
          marginLeft: sidebarCollapsed ? "80px" : "270px", 
          transition: "margin-left 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Fixed Header */}
        <div 
          style={{ 
            position: "fixed",
            top: 0,
            right: 0,
            left: sidebarCollapsed ? "80px" : "270px",
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0)",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0)",
            transition: "left 0.3s ease",
          }}
        >          <Header
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
          
          {/* Refresh Indicator */}
          {showRefreshMessage && (
            <div 
              style={{
                position: "fixed",
                top: "70px",
                right: "20px",
                backgroundColor: "#4CAF50",
                color: "white",
                padding: "10px 15px",
                borderRadius: "4px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                zIndex: 1000,
                animation: "fadeIn 0.5s, fadeOut 0.5s 2.5s forwards"
              }}
            >
              Dashboard refreshed with the latest data
            </div>
          )}
        </div>

        {/* Main Dashboard Content - add padding-top to account for fixed header */}
        <div style={{ 
          padding: "20px", 
          marginTop: "60px" // Adjust this value based on your header's height
        }}>
          {/* Widgets Section */}
          <div className="row mb-2">
            {/* Left Section: Smaller Widgets */}
            <div className="col-md-8">
              <div className="row">
                {/* Students widget */}
                <div className="col-md-3">
                  <div
                    className="card shadow-sm text-center"
                    style={{
                      backgroundColor: darkMode ? "#333" : "#e9ecef",
                      color: darkMode ? "white" : "black", 
                      border: "none", 
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                      e.currentTarget.style.backgroundColor = randomColor;
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.setProperty('background-color', randomColor, 'important');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef"; 
                      e.currentTarget.style.color = darkMode ? "white" : "black"; 
                    }}
                    onClick={navigateToStudents}
                  >
                    <div className="card-body" style={{ padding: "10px" }}>
                      <h6 style={{ color: darkMode ? "white" : "inherit" }}>Total Students</h6>
                      <p className="display-6" style={{ color: darkMode ? "white" : "inherit" }}>{stats.total_students || 0}</p>
                    </div>
                  </div>
                </div>
                
                {/* Assignments widget */}
                <div className="col-md-3">
                  <div
                    className="card shadow-sm text-center"
                    style={{
                      backgroundColor: darkMode ? "#333" : "#e9ecef",
                      color: darkMode ? "white" : "black",
                      border: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                      e.currentTarget.style.backgroundColor = randomColor;
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.setProperty('background-color', randomColor, 'important');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef";
                      e.currentTarget.style.color = darkMode ? "white" : "black";
                    }}
                    onClick={navigateToAssignments}
                  >
                    <div className="card-body" style={{ padding: "10px" }}>
                      <h6 style={{ color: darkMode ? "white" : "inherit" }}>Assignments to Grade</h6>
                      <p className="display-6" style={{ color: darkMode ? "white" : "inherit" }}>{stats.assignments_to_grade || 0}</p>
                    </div>
                  </div>
                </div>
                
                {/* Quizzes widget */}
                <div className="col-md-3">
                  <div
                    className="card shadow-sm text-center"
                    style={{
                      backgroundColor: darkMode ? "#333" : "#e9ecef",
                      color: darkMode ? "white" : "black", 
                      border: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                      e.currentTarget.style.backgroundColor = randomColor;
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.setProperty('background-color', randomColor, 'important');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef";
                      e.currentTarget.style.color = darkMode ? "white" : "black";
                    }}
                    onClick={navigateToQuizzes}
                  >
                    <div className="card-body" style={{ padding: "10px" }}>
                      <h6 style={{ color: darkMode ? "white" : "inherit" }}>Quizzes Created</h6>
                      <p className="display-6" style={{ color: darkMode ? "white" : "inherit" }}>{stats.quizzes_created || 0}</p>
                    </div>
                  </div>
                </div>
                
                {/* Certificates widget */}
                <div className="col-md-3">
                  <div
                    className="card shadow-sm text-center"
                    style={{
                      backgroundColor: darkMode ? "#333" : "#e9ecef",
                      color: darkMode ? "white" : "black", 
                      border: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                      e.currentTarget.style.backgroundColor = randomColor;
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.setProperty('background-color', randomColor, 'important');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef";
                      e.currentTarget.style.color = darkMode ? "white" : "black";
                    }}
                    onClick={navigateToCertificates}
                  >
                    <div className="card-body" style={{ padding: "10px" }}>
                      <h6 style={{ color: darkMode ? "white" : "inherit" }}>Certificates Issued</h6>
                      <p className="display-6" style={{ color: darkMode ? "white" : "inherit" }}>{stats.certificates_issued || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graph Widgets */}
              <div className="row mt-2">
                <div className="col-md-8">
                  <div className="card shadow-sm" style={{ backgroundColor: darkMode ? "#333" : "white" }}>
                    <div className="card-body" style={{ padding: "10px" }}>
                      <h5 style={{ color: darkMode ? "white" : "inherit" }}>Class Activity Trends</h5>
                      <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow-sm" style={{ backgroundColor: darkMode ? "#333" : "white" }}>
                    <div className="card-body" style={{ padding: "10px" }}>
                      <h5 style={{ color: darkMode ? "white" : "inherit" }}>Activity Breakdown</h5>
                      <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Calendar */}
            <div className="col-md-4">
              <div className="card shadow-sm" style={{ backgroundColor: darkMode ? "#333" : "white" }}>
                <div
                  className="card-body"
                  style={{
                    padding: "10px",
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "flex-start", 
                    height: "100%", 
                    flexDirection: "column", 
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center w-100 mb-2">
                    <h5 style={{ margin: "0", color: darkMode ? "white" : "inherit" }}>Event Calendar</h5>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={handleAddEvent}
                      style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem" }}
                    >
                      <FaPlus size={12} className="me-1" /> Add Event
                    </button>
                  </div>
                  <CalendarComponent
                    renderDay={(day, _value, DayComponentProps) => {
                      const formattedDate = day.format("YYYY-MM-DD");
                      const isToday = day.isSame(dayjs(), "day"); 
                      const hasEvent = events.some((event) => event.event_date === formattedDate); 
                      const isOutsideCurrentMonth = DayComponentProps.outsideCurrentMonth; 
                  
                      
                      const { today, ...validProps } = DayComponentProps;
                  
                      return (
                        <div
                          {...validProps} 
                          key={formattedDate} 
                          style={{
                            ...DayComponentProps.style,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: hasEvent ? (darkMode ? "#551c1c" : "#ffcccc") : undefined, 
                            color: isOutsideCurrentMonth 
                              ? (darkMode ? "#777" : "#d3d3d3") 
                              : (darkMode ? "white" : undefined),  
                            border: isToday ? "2px solid #032794" : undefined, 
                            borderRadius: "50%", 
                            width: "36px", 
                            height: "36px", 
                            margin: "auto", 
                            cursor: "pointer", 
                          }}
                          onClick={() => handleDayClick(day)} 
                        >
                          {day.date()}
                        </div>
                      );
                    }}
                    handleEditEvent={handleEditEvent}  // Pass the edit function to the calendar
                    fetchDashboardData={fetchDashboardData}  // Pass refresh function
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Event Modal */}
      <Modal 
        show={showEventModal} 
        onHide={() => setShowEventModal(false)} 
        size="lg" 
        backdrop="static"
        centered
        contentClassName={darkMode ? "bg-dark" : ""}
      >
        <Modal.Header 
          style={{ 
            color: darkMode ? "white" : "black",
            backgroundColor: darkMode ? "#333" : "white", 
          }}
          className={darkMode ? "border-dark" : ""}
        >
          <Modal.Title>
            <FaCalendarAlt className="me-2" />
            {isEditMode ? 'Edit Event' : 'Add New Event'}

          </Modal.Title>
          <div 
            onClick={() => setShowEventModal(false)}
            style={{
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 'bold',
              marginLeft: 'auto',
              padding: '0 10px',
            }}
          >
            <FaTimes color={darkMode ? 'white' : '#333'} />
          </div>
        </Modal.Header>
        <Modal.Body className={darkMode ? "bg-dark text-light" : ""}>
          <Form onSubmit={handleSubmitEvent}>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                name="name" 
                value={eventData.name}
                onChange={handleInputChange}
                required
                style={{
                  backgroundColor: darkMode ? "white" : "#f8f9fa", 
                  color: "black"
                }}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date <span className="text-danger">*</span></Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control 
                  type="date" 
                  name="date" 
                  value={eventData.date}
                  onChange={handleInputChange}
                  required
                  className="me-2"
                  style={{
                    backgroundColor: darkMode ? "white" : "#f8f9fa", 
                    color: "black"
                  }}
                />
                <Button 
                  variant={darkMode ? "outline-light" : "outline-danger"}
                  size="sm"
                  onClick={handleSetToday}
                  className="d-flex align-items-center"
                >
                  Today <FaCalendarAlt className="ms-1" />
                </Button>
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Time <span className="text-danger">*</span></Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control 
                  type="time" 
                  name="time" 
                  value={eventData.time}
                  onChange={handleInputChange}
                  required
                  className="me-2"
                  style={{
                    backgroundColor: darkMode ? "white" : "#f8f9fa", 
                    color: "black"
                  }}
                />
                <Button 
                  variant={darkMode ? "outline-light" : "outline-danger"}
                  size="sm"
                  onClick={handleSetNow}
                  className="d-flex align-items-center"
                >
                  Now <FaCalendarAlt className="ms-1" />
                </Button>
              </div>
              <Form.Text className={darkMode ? "text-light" : "text-muted"}>
                Note: you are 2 hours ahead of server time.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="This is a live video session"
                checked={isLiveSession}
                onChange={handleToggleLiveSession}
                className="mb-2"
                style={{
                  color: darkMode ? "#e0e0e0" : "inherit"
                }}
              />
              
              {isLiveSession && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Platform <span className="text-danger">*</span></Form.Label>
                    <Form.Select 
                      name="platform"
                      value={eventData.platform}
                      onChange={handleInputChange}
                      required
                      style={{
                        backgroundColor: darkMode ? "white" : "#f8f9fa", 
                        color: "black"
                      }}
                    >
                      <option value="other">Other</option>
                      <option value="zoom">Zoom</option>
                      <option value="google_meet">Google Meet</option>
                      <option value="ms_teams">Microsoft Teams</option>
                      <option value="webex">WebEx</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Invite link</Form.Label>
                    <Form.Control 
                      type="url" 
                      name="invite_link" 
                      value={eventData.invite_link}
                      onChange={handleInputChange}
                      placeholder="https://"
                      style={{
                        backgroundColor: darkMode ? "white" : "#f8f9fa", 
                        color: "black"
                      }}
                    />
                  </Form.Group>
                </>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="description" 
                value={eventData.description}
                onChange={handleInputChange}
                style={{
                  backgroundColor: darkMode ? "white" : "#f8f9fa", 
                  color: "black"
                }}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <FaUserFriends className="me-1" /> Groups
              </Form.Label>
              <Form.Select 
                multiple 
                name="groups"
                value={eventData.groups}
                onChange={(e) => handleMultiSelect(e, 'groups')}
                style={{
                  backgroundColor: darkMode ? "white" : "#f8f9fa", 
                  color: "black"
                }}
              >
                {Array.isArray(availableGroups) ? (
                  availableGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))
                ) : (
                  <option value="">No groups available</option>
                )}
              </Form.Select>
              <Form.Text className={darkMode ? "text-light" : "text-muted"}>
                Hold down "Control", or "Command" on a Mac, to select more than one.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <FaUsers className="me-1" /> Users
              </Form.Label>
              <Form.Select 
                multiple 
                name="users"
                value={eventData.users}
                onChange={(e) => handleMultiSelect(e, 'users')}
                style={{
                  backgroundColor: darkMode ? "white" : "#f8f9fa", 
                  color: "black"
                }}
              >
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name || user.email}</option>
                ))}
              </Form.Select>
              <Form.Text className={darkMode ? "text-light" : "text-muted"}>
                Hold down "Control", or "Command" on a Mac, to select more than one.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                id="send-to-all"
                label="Send to all"
                name="send_to_all"
                checked={eventData.send_to_all}
                onChange={handleInputChange}
                style={{
                  color: darkMode ? "#e0e0e0" : "inherit"
                }}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant={darkMode ? "outline-light" : "secondary"} 
                className="me-2" 
                onClick={() => setShowEventModal(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Day Events Modal */}
      <Modal 
        show={showDayEventsModal} 
        onHide={() => setShowDayEventsModal(false)}
        size="md"
        centered
        contentClassName={darkMode ? "bg-dark" : ""}
      >
        <Modal.Header 
          style={{ 
            color: darkMode ? "white" : "black",
            backgroundColor: darkMode ? "#333" : "white", 
          }}
          className={darkMode ? "border-dark" : ""}
        >

        </Modal.Header>
        <Modal.Body className={darkMode ? "bg-dark text-light" : ""}>
          {selectedDayEvents.length > 0 ? (
            <div>
              {selectedDayEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="d-flex justify-content-between align-items-center p-2 mb-2"
                  style={{
                    backgroundColor: darkMode ? "#444" : "#f8f9fa",
                    borderRadius: "4px"
                  }}
                >
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{event.name}</h6>
                    <small>
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {event.platform && event.platform !== 'other' && ` - ${event.platform}`}
                    </small>
                  </div>
                  <div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => {
                        setShowDayEventsModal(false);
                        handleEditEvent(event.id);
                      }}
                      className="me-2"
                      title="Edit event"
                    >
                      <FaPencilAlt /> Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      title="Delete event"
                    >
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center">No events scheduled for this day.</p>
          )}
        </Modal.Body>
      </Modal>
      {/* Add these styles for dark mode text color overrides */}
      <style>
        {`
          /* Dark mode text color overrides */
          .dark-mode h1, .dark-mode h2, .dark-mode h4, .dark-mode h5, .dark-mode h6,
          .dark-mode p, .dark-mode span, {
            color: white !important;
          }
          .dark-mode .card {
            background-color: #333 !important;
          }
          
          .dark-mode .card-body h5 {
            color: white !important;
          }
          
          .dark-mode .card-body h6 {
            color: white !important;
            
          }
          
          .dark-mode .card-body p {
            color: white !important;
          }
          
          .dark-mode .display-6 {
            color: white !important;
          }
          
          /* Calendar day styling override for dark mode */
          .dark-mode .MuiPickersDay-root:not(.Mui-selected) {
            color: white !important;
          }
          .dark-mode .css-1u9f8qc-MuiTypography-root {
          color: white !important;
          }
          .dark-mode .css-3vnhty  {
            color: black !important;
          }
          .dark-mode .css-yg5mi2 {
            color: white !important;
          }
            dark-mode .css-1bm6bgu {
            color: white !important;
        }
          .dark-mode .from-check-label {
          color: black !important;
          }
            .dark-mode .mb-3 {
            color: black !important;
          }
            .dark-mode .text-danger {
            color: #dc3545 !important;
          }
        `}
      </style>
    </div>
  );
}

export default InstructorDashboard;