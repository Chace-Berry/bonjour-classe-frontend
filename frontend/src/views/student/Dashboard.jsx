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
import Sidebar from "./Partials/Sidebar";
import Header from "../instructor/Partials/Header";
import Cookies from "js-cookie";
import UserData from "../plugin/UserData";
import CalendarComponent from "./Partials/CalendarComponent";
import LoadingScreen from "../../components/LoadingScreen"; // Import the custom loading screen
import dayjs from "dayjs"; // Import dayjs for calendar date handling
import MobileNav from "./Partials/Mobile_Nav";
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

function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [stats, setStats] = useState({});
  const [newCourses, setNewCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [isRefreshing, setIsRefreshing] = useState(false); // Track if user data is being refreshed
  const [darkMode, setDarkMode] = useState(false); // Added darkMode state
  const [events, setEvents] = useState([]); // Add events state for calendar
  const [showRefreshMessage, setShowRefreshMessage] = useState(false); // Track if we should show refresh message
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  // Track screen width for responsive nav
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Add function to fetch dark mode setting
  const fetchDarkModeSetting = async () => {
    try {
      const response = await useAxios().get('/user/appearance-settings/');
      if (response.data && response.data.dark_mode !== undefined) {
        setDarkMode(response.data.dark_mode);
//        console.log("Dark mode setting loaded:", response.data.dark_mode);
      }
    } catch (error) {
//      console.error("Error fetching dark mode setting:", error);
    }
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

  const handleSignOut = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token"); 
    navigate("/");
  };

  const fetchProfile = async () => {
    try {
      const response = await useAxios().get(`user/profile/${UserData()?.user_id}/`);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response && error.response.status === 401) {
        navigate("/");
      }
    }
  };

  // Update the fetchDashboardData function to get comprehensive activity data
  const fetchDashboardData = async () => {
    const userId = UserData()?.user_id;
    if (!userId) {
      navigate("/");
      return;
    }
  
    try {
      // Get comprehensive student activity summary
      const statsResponse = await useAxios().get(`student/summary/${userId}/`);
//      console.log("Dashboard data response:", statsResponse);
      
      // Check if the response array is empty or undefined
      if (!statsResponse.data || statsResponse.data.length === 0) {
//        console.error("Empty response data from API");
        return;
      }
      
      // Extract the first item from the array
      const responseData = statsResponse.data[0];
//      console.log("Dashboard data content:", responseData);
      
      // Convert month numbers from backend to month names
      const monthsFromBackend = responseData.months || [];
      const monthNames = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];
      const formattedMonths = monthsFromBackend.map(monthNum => monthNames[monthNum - 1]);
      
      // Map the backend response fields to our widget names
      setStats({
        // Small widgets data
        total_courses: responseData?.total_courses || 0,
        incomplete_lectures: responseData?.incomplete_lectures || 0,
        pending_assignments: responseData?.pending_assignments || 0,
        available_quizzes: responseData?.available_quizzes || 0,
        
        // Monthly chart data - correctly access the monthly_quiz_activity, etc. arrays
        monthly_quiz_activity: responseData?.monthly_quiz_activity || [0, 0, 0],
        monthly_assignment_activity: responseData?.monthly_assignment_activity || [0, 0, 0],
        monthly_lecture_activity: responseData?.monthly_lecture_activity || [0, 0, 0],
        
        // Use month names from the backend if available, otherwise fallback to getLastThreeMonths
        months: formattedMonths.length === 3 ? formattedMonths : getLastThreeMonths(),
        
        // Daily activity data from API - properly parse these fields
        daily_quiz_count: responseData?.daily_quiz_count || 0, 
        daily_assignment_count: responseData?.daily_assignment_count || 0,
        daily_lecture_count: responseData?.daily_lecture_count || 0, 
        daily_other_count: responseData?.daily_other_count || 0,
      });
  
      try {
        const notificationsResponse = await useAxios().get(`notifications/user/${userId}/`);
        setNotifications(notificationsResponse.data);
      } catch (notificationError) {
//        console.error("Error fetching notifications:", notificationError);
        // It's okay if notifications fail, don't stop the dashboard from loading
      }
    } catch (error) {
//      console.error("Error fetching dashboard data:", error);
    }
  };

  const refreshUserData = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  };
  useEffect(() => {
    const initializeDashboard = async () => {
      // Check if this is the second load after a forced refresh
      const wasRefreshed = sessionStorage.getItem('refreshed_student_dashboard');
      
      if (wasRefreshed) {
        // Clear the refresh flag
        sessionStorage.removeItem('refreshed_student_dashboard');
        // Show the refresh message briefly
        setShowRefreshMessage(true);
        setTimeout(() => {
          setShowRefreshMessage(false);
        }, 3000);
      } else {
        // Check if this was a force refresh
        const path = '/student/dashboard/';
        const visitKey = `visited_${path.replace(/\//g, '_')}`;
        const justVisited = sessionStorage.getItem(visitKey) === 'true';
        
        if (justVisited) {
          // Set a flag to show the refresh message on the next load
          sessionStorage.setItem('refreshed_student_dashboard', 'true');
        }
      }

      await fetchProfile();
      await fetchDashboardData();
      await fetchDarkModeSetting(); // Added to fetch dark mode setting

      // Force a 3-second loading screen
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

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

  // Handle calendar day click
  const handleDayClick = (day) => {
    const formattedDate = day.format("YYYY-MM-DD");
//    console.log(`Calendar day clicked: ${formattedDate}`);
    // You can implement functionality to show events for this day
    // or navigate to a detailed view
  };

  // Update the Line Chart for comprehensive monthly activity tracking
  const lineChartData = {
    labels: stats.months || getLastThreeMonths(),
    datasets: [
      {
        label: "Quiz Activity",
        data: stats.monthly_quiz_activity || [],
        borderColor: "#6a5acd",
        backgroundColor: "rgba(106, 90, 205, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Assignment Activity",
        data: stats.monthly_assignment_activity || [],
        borderColor: "#ff6347",
        backgroundColor: "rgba(255, 99, 71, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Lecture Activity",
        data: stats.monthly_lecture_activity || [],
        borderColor: "#4bc0c0",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          },
          color: darkMode ? "#f0f0f0" : "#666"
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw} items`;
          },
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
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? "#444" : "#f0f0f0",
        },
        ticks: {
          color: darkMode ? "#f0f0f0" : "#666"
        }
      },
    },
  };

  
  // Update Doughnut Chart for daily activity breakdown by type
  const doughnutChartData = {
    labels: ["Quizzes", "Assignments", "Lectures", "Other"],
    datasets: [{
      data: [
        stats.daily_quiz_count || 0,
        stats.daily_assignment_count || 0,
        stats.daily_lecture_count || 0,
        stats.daily_other_count || 0
      ],
      backgroundColor: [
        "#6a5acd", "#ff6347", "#4bc0c0", "#e0e0e0"
      ],
      hoverBackgroundColor: [
        "#483d8b", "#d53f31", "#3da8a8", "#c3c3c3"
      ],
    }]
  };

  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          },
          color: darkMode ? "#f0f0f0" : "#666"
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label;
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "70%",
  };

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar for desktop/tablet, MobileNav for mobile */}
        {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            marginLeft: !isMobile ? (sidebarCollapsed ? "80px" : "270px") : 0,
            transition: "margin-left 0.3s ease",
          }}
        >          {/* Header */}
          <Header
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

          {/* Main Dashboard Content */}
          <div style={{ padding: "20px" }}>
            {/* Widgets Section */}
            <div className="row mb-2">
              {/* Left Section: Smaller Widgets */}
              <div className="col-md-8">
                <div className="row">
                  <div className="col-md-3">
                    <div
                      className="card shadow-sm text-center"
                      style={{
                        backgroundColor: darkMode ? "#333" : "#e9ecef", 
                        color: darkMode ? "white" : "black", 
                        border: "none", 
                        transition: "background-color 0.3s ease", 
                      }}
                      onMouseEnter={(e) => {
                        const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                        e.currentTarget.style.backgroundColor = randomColor;
                        e.currentTarget.style.color = "white"; 
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef"; 
                        e.currentTarget.style.color = darkMode ? "white" : "black"; 
                      }}
                    >
                      <div className="card-body" style={{ padding: "10px" }}>
                        <h6>Enrolled Courses</h6>
                        <p className="display-6">{stats.total_courses || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div
                      className="card shadow-sm text-center"
                      style={{
                        backgroundColor: darkMode ? "#333" : "#e9ecef",
                        color: darkMode ? "white" : "black",
                        border: "none",
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                        e.currentTarget.style.backgroundColor = randomColor;
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef";
                        e.currentTarget.style.color = darkMode ? "white" : "black";
                      }}
                    >
                      <div className="card-body" style={{ padding: "10px" }}>
                        <h6>Incomplete Lectures</h6>
                        <p className="display-6">{stats.incomplete_lectures || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div
                      className="card shadow-sm text-center"
                      style={{
                        backgroundColor: darkMode ? "#333" : "#e9ecef",
                        color: darkMode ? "white" : "black",
                        border: "none",
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                        e.currentTarget.style.backgroundColor = randomColor;
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef";
                        e.currentTarget.style.color = darkMode ? "white" : "black";
                      }}
                    >
                      <div className="card-body" style={{ padding: "10px" }}>
                        <h6>Pending Assignments</h6>
                        <p className="display-6">{stats.pending_assignments || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div
                      className="card shadow-sm text-center"
                      style={{
                        backgroundColor: darkMode ? "#333" : "#e9ecef",
                        color: darkMode ? "white" : "black",
                        border: "none",
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        const randomColor = Math.random() > 0.5 ? "#8c0101" : "#034287"; 
                        e.currentTarget.style.backgroundColor = randomColor;
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode ? "#333" : "#e9ecef";
                        e.currentTarget.style.color = darkMode ? "white" : "black";
                      }}
                    >
                      <div className="card-body" style={{ padding: "10px" }}>
                        <h6>Available Quizzes</h6>
                        <p className="display-6">{stats.available_quizzes || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graph Widgets */}
                <div className="row mt-2">
                  <div className="col-md-8">
                    <div className="card shadow-sm">
                      <div className="card-body" style={{ 
                        padding: "10px", 
                        backgroundColor: darkMode ? "#333" : "#fff",
                        color: darkMode ? "#f0f0f0" : "#333"
                      }}>
                        <h5>Monthly Course Activity</h5>
                        <Line data={lineChartData} options={lineChartOptions} />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card shadow-sm">
                      <div className="card-body" style={{ 
                        padding: "10px", 
                        backgroundColor: darkMode ? "#333" : "#fff",
                        color: darkMode ? "#f0f0f0" : "#333"
                      }}>
                        <h5>Daily Activity Breakdown</h5>
                        <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: Class Schedule */}
              <div className="col-md-3">
                <div className="card shadow-sm">
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
                    <h5 style={{ textAlign: "center", marginBottom: "10px" }}>Event Calander</h5>
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
                              backgroundColor: hasEvent ? "#ffcccc" : undefined, 
                              color: isOutsideCurrentMonth ? "#d3d3d3" : undefined, 
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
                    />

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isMobile && <MobileNav />}
    </>
  );
}

export default Dashboard;